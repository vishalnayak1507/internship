// import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle } from "lucide-react";

export const ResolveModal = ({
  open,
  onClose,
  ticket,
  remarks,
  setRemarks,
  onConfirm,
  isSubmitting = false
}) => {
  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white border-0 shadow-lg">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Resolve Ticket</span>
            </DialogTitle>
            <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
          </div>
          <p className="text-sm text-gray-600">Complete the resolution details below</p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Ticket Number</p>
                <p className="font-medium">{ticket.ticketNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="font-medium">{ticket.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <p className="font-medium">{ticket.categoryName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">SLA Deadline</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span className={getSLAColorClass(ticket.slaDeadline)}>
                    {formatDeadline(ticket.slaDeadline)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-700">Issue Description</h4>
            <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 max-h-32 overflow-y-auto border border-gray-100">
              {ticket.description || "No description provided"}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Remarks <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Please provide resolution details..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="resize-none bg-white border-gray-200 focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
              required
            />
            <p className="text-xs text-gray-600 mt-2 flex items-center">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
              These remarks will be added to the ticket history and visible to the customer
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-3 border-t pt-3">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
              className="sm:w-auto w-1/2"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const trimmedRemarks = remarks.trim(); // Trim the remarks
                if (trimmedRemarks) {
                  onConfirm(trimmedRemarks); // Pass trimmed remarks to the onConfirm function
                }
              }}
              disabled={!remarks.trim() || isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white sm:w-auto w-1/2"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Submitting...
                </>
              ) : "Confirm Resolution"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper functions
const getPriorityVariant = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'HIGH': return 'destructive';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'default';
    default: return 'secondary';
  }
};

const formatDeadline = (dateString) => {
  if (!dateString) return "No SLA";
  const deadline = new Date(dateString);
  const now = new Date();
  const timeLeft = deadline - now;
  
  if (timeLeft < 0) return "SLA Breached";
  if (timeLeft < 2 * 60 * 60 * 1000) {
    const minutesLeft = Math.floor(timeLeft / (60 * 1000));
    return `${minutesLeft} min left`;
  }
  if (timeLeft < 24 * 60 * 60 * 1000) {
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
    return `${hoursLeft} hours left`;
  }
  const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
  return `${daysLeft} days left`;
};

const getSLAColorClass = (dateString) => {
  if (!dateString) return "text-gray-600";
  
  const deadline = new Date(dateString);
  const now = new Date();
  const timeLeft = deadline - now;
  
  if (timeLeft < 0) return "text-red-600 font-semibold";
  if (timeLeft < 2 * 60 * 60 * 1000) return "text-amber-600 font-semibold";
  if (timeLeft < 24 * 60 * 60 * 1000) return "text-amber-500";
  return "text-green-600";
};