import mongoose from 'mongoose';
 
const ticketDiscussionSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      ref: 'Ticket'
    },
    discussionBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    remarks: {
      type: [
        {
          isCustomerDetail : {
            type : Boolean,
            required : true,
          },
          userDetail: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',

          },
          resolvedTime: { type: Date },
          message: {
            type: String,
            required: true,
            maxlength: 300
          },
          resolvedTime:{
            type: Date
          }
        }
      ],
      default: []
    },
    subject: {
      type: String,
      maxlength: 200
    },
    discussionType: {
      type: String,
      enum: ['Internal', 'Customer', 'System'],
      default: 'Internal'
    }
  },
  {
    timestamps: true
  }
);
 
// Add indexes for better query performance
ticketDiscussionSchema.index({ ticketNumber: 1, createdAt: -1 });
ticketDiscussionSchema.index({ discussionBy: 1 });
 
const TicketDiscussion = mongoose.model('TicketDiscussion', ticketDiscussionSchema);
 
export default TicketDiscussion;
 