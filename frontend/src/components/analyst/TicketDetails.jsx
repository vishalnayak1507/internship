// This code is not being used anywhere
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { X, Clock, User, Mail } from 'lucide-react';

export const TicketDetails = ({ ticket, onClose, onStatusUpdate }) => {
  const [reply, setReply] = useState('');
  const [closingRemark, setClosingRemark] = useState('');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendReply = () => {
    if (reply.trim()) {
      onStatusUpdate(ticket._id, 'resolved', reply);
      setReply('');
      onClose();
    }
  };

  const handleCloseTicket = () => {
    if (closingRemark.trim()) {
      onStatusUpdate(ticket._id, 'closed', null, closingRemark);
      setClosingRemark('');
      onClose();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Ticket Details - #{ticket.ticketNumber}
            </h2>
            <Badge 
              variant="outline" 
              className={getPriorityColor(ticket.priority)}
            >
              {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)} Priority
            </Badge>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status === 'in-progress' ? 'In Progress' : 
               ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1)}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Customer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {ticket.customerName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">{ticket.customerName}</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{ticket.customerEmail}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-medium text-gray-700">Source Type</label>
                  <p className="text-sm text-gray-900 capitalize">{ticket.sourceType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <p className="text-sm text-gray-900">{ticket.department || 'N/A'}</p>
                </div>
                {ticket.masterData && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <p className="text-sm text-gray-900">{ticket.masterData.categoryName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Module</label>
                      <p className="text-sm text-gray-900">{ticket.masterData.moduleName}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ticket.title || 'No Title'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{ticket.description || 'No Description'}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Modified</label>
                  <p className="text-sm text-gray-900">{formatDate(ticket.lastModified || ticket.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">SLA Deadline</label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-900">{formatDate(ticket.slaDeadline)}</span>
                  </div>
                </div>
                {ticket.assignedTo && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned To</label>
                    <p className="text-sm text-gray-900">{ticket.assignedTo}</p>
                  </div>
                )}
                {ticket.assignedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned At</label>
                    <p className="text-sm text-gray-900">{formatDate(ticket.assignedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reply Section */}
          {ticket.status === 'in-progress' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send Reply</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your reply to the customer..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSendReply}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!reply.trim()}
                  >
                    Send Reply & Mark Resolved
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Closing Remark Section */}
          {ticket.status === 'resolved' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Close Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add closing remarks for this ticket..."
                  value={closingRemark}
                  onChange={(e) => setClosingRemark(e.target.value)}
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleCloseTicket}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!closingRemark.trim()}
                  >
                    Close Ticket
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};