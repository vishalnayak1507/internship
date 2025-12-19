import { issueHierarchy } from "../../lib/issueHierarchy.js";
import TicketMaster from "../../models/Master.js";
import Ticket from "../../models/Ticket.js";
import TicketDiscussion from "../../models/TicketDiscussion.js";
import User from "../../models/User.js"
import { autoAssignQueue } from "../../scripts/autoAssignQueue.js";

const access_maker_route = (req, res) => {
    const user = req.user
    return res.status(200).json({ success: true, message: "Token Verified", user })
}

const maker_entry = async (req, res) => {
    const { customerId, customerName, customerCountryCode, customerPhoneNumber, customerEmail, mode, categoryName, moduleName, description, department } = req.body
    // Manual validation
    if (!customerName || !customerCountryCode || !customerPhoneNumber || !mode || !categoryName || !moduleName || !description) {
        return res.status(400).json({ success: false, message: "All required fields must be provided" })
    }

    if (!department) {
        return res.status(400).json({ success: false, message: "Department must be provided" })
    }

    if (!/^\+\d{1,4}$/.test(customerCountryCode)) {
        return res.status(400).json({ success: false, message: "Country code must be in the format +91, +1, etc.", });
    }

    if (!/^\d{10}$/.test(customerPhoneNumber)) {
        return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" })
    }
    // /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (customerEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(customerEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email format" })
    }

    if (!["Call", "Email", "Message", "Others"].includes(mode)) {
        return res.status(400).json({ success: false, message: "Invalid query mode" })
    }

    try {
        const phoneDigits = customerPhoneNumber.replace(/\D/g, "");
        const last3 = phoneDigits.slice(-3);
        const timePart = (Date.now() % 100000).toString().padStart(5, "0");
        const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
        const ticketNumber = `${department}${last3}${timePart}${rand}`;

        const master_response = await TicketMaster.findOne({ categoryName: categoryName, moduleName: moduleName })
        if (!master_response) {
            return res.status(400).json({ success: false, message: "Invalid Category or Module" })
        }

        let slaDeadline = null;
        if (master_response.expected_SLA) {
            // Assuming expected_SLA is in hours
            slaDeadline = new Date(Date.now() + master_response.expected_SLA * 60 * 60 * 1000);
        }

        const createdBy = req.user._id;

        const combinedPhoneNumber = `${customerCountryCode}${customerPhoneNumber}`;

        const ticket = new Ticket({
            ticketNumber: ticketNumber,
            customerName: customerName,
            customerPhoneNumber: combinedPhoneNumber, // Combine country code and phone number
            customerEmail: customerEmail,
            sourceType: mode,
            lastModifiedAt: Date.now(),
            creationTime: Date.now(),
            status: 'Open',
            description: description,
            masterData: master_response._id,
            priority: master_response.priority,
            severity: master_response.severity,
            expected_SLA: master_response.expected_SLA,
            slaDeadline: slaDeadline,
            createdBy: createdBy,
            department: department,
            otherModeText: mode === "Others" ? req.body.otherModeText : undefined,
        })
        await ticket.save();
        await TicketDiscussion.create({
            ticketNumber: ticket.ticketNumber,
            discussionBy: req.user._id,
            remarks: [
                {
                    isCustomerDetail: true,
                    userDetail: ticket.createdBy, //it will be makers _id here but we will fetch cutomer details from ticketNumber in tickets collection
                    message: ticket.description
                }
            ],
            subject: "description",
            discussionType: "Internal"
        });
        // If assignedTo is null, add to auto-assign queue
        if (ticket.assignedTo === null) {
            await autoAssignQueue.pause();
            await autoAssignQueue.add('assign', {
                ticketId: ticket._id,
                department: ticket.department,
            }, {
                priority: ticket.priority === "P1" ? 1 : ticket.priority === "P2" ? 2 : 3,
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            })
            await autoAssignQueue.resume();
        }
        res.status(201).json({ success: true, ticket })
    } catch (error) {
        console.error("Error in maker_entry:", error)
        res.status(500).json({ success: false, message: "server error" })
    }
};

const get_my_tickets = async (req, res) => {
    try {

        const createdBy = req.user._id;
        const tickets = await Ticket.find({ createdBy }).populate('masterData');


        // Fetch all TicketDiscussion entries for these tickets with subject "description"
        const ticketNumbers = tickets.map(t => t.ticketNumber);
        const discussions = await TicketDiscussion.find({
            ticketNumber: { $in: ticketNumbers },
            subject: "description"
        }).lean();

        // Map ticketNumber to remarks
        const discussionMap = {};
        const userIds = [];
        discussions.forEach(disc => {
            if (disc.remarks && disc.remarks.length > 0) {
                const remark = disc.remarks[0];
                discussionMap[disc.ticketNumber] = {
                    message: remark.message,
                    userDetail: remark.userDetail ? remark.userDetail.toString() : null
                };
                if (remark.userDetail) {
                    userIds.push(remark.userDetail.toString());
                }
            }
            else {
                discussionMap[disc.ticketNumber] = {
                    message: "-",
                    userDetail: null
                };
            }
        });

        // Fetch user details for all userIds found in discussions
        const users = await User.find({ _id: { $in: userIds } }).select("_id name").lean();
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u.name; });

        // Attach description from TicketDiscussion to each ticket
        // Attach categoryName and moduleName from masterData, and description from TicketDiscussion
        const ticketsWithDescription = tickets.map(ticket => ({
            ...(ticket.toObject ? ticket.toObject() : ticket),
            categoryName: ticket.masterData?.categoryName || "-",
            department: ticket.department || "-",
            moduleName: ticket.masterData?.moduleName || "-",
            //description: discussionMap[ticket.ticketNumber]?.message || "-",
            description: ticket.description || "-",
            descriptionSender: userMap[discussionMap[ticket.ticketNumber]?.userDetail] || "-",
            createdBy: ticket.createdBy,
        }));

    res.status(200).json({ success: true, tickets: ticketsWithDescription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "server error" });
  }
};
const get_ticketmasters = async (req, res) => {
  try {
    const { department } = req.query;
    let query = {};
    if (department) query.department = department;
    const ticketmasters = await TicketMaster.find(query).lean();
    res.status(200).json({ ticketmasters });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "server error" });
  }
};

export{
    maker_entry,
    access_maker_route,
    get_my_tickets,
    get_ticketmasters,
}
