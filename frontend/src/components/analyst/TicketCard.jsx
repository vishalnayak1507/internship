//This code is not being used anywhere
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, User, ArrowRight, Mail, Phone, MessageSquare, Upload } from 'lucide-react';

export const TicketCard = ({ ticket, onClaim, onStatusUpdate, onSelect }) => {
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
  function getSlaDisplay(ticket) {
  if (!ticket?.slaDeadline) return "No SLA";
  const deadline = new Date(ticket.slaDeadline);
  const now = new Date();
  const isBreached = deadline < now;
  const isResolvedOrClosed = ["Resolved", "Closed"].includes(ticket.status);

  if (isResolvedOrClosed && isBreached) {
    const resolvedAt = new Date(ticket.lastModifiedAt || ticket.updatedAt || now);
    let diffMs = resolvedAt - deadline;
    if (diffMs < 0) diffMs = 0;
    const diffSec = Math.floor(diffMs / 1000) % 60;
    const diffMin = Math.floor(diffMs / (1000 * 60)) % 60;
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return (
      <>
        <span className="text-red-600 font-semibold">SLA Breached</span>
        <br />
        <span className="text-gray-700">
          Resolved after {diffDay}d {diffHour}h {diffMin}m {diffSec}s of SLA breach
        </span>
      </>
    );
  }
  if (isBreached) {
    // Show timer for how long it's been breached
    let diffMs = now - deadline;
    if (diffMs < 0) diffMs = 0;
    const diffSec = Math.floor(diffMs / 1000) % 60;
    const diffMin = Math.floor(diffMs / (1000 * 60)) % 60;
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return (
      <>
        <span className="text-red-600 font-semibold">SLA Breached</span>
        <br />
        <span className="text-red-500">
          Overdue by {diffDay}d {diffHour}h {diffMin}m {diffSec}s
        </span>
      </>
    );
  }
  // Default: show remaining time or deadline
  return (
    <span>
      SLA: {ticket.slaDeadline ? deadline.toLocaleString() : "N/A"}
    </span>
  );
}
  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'file upload':
        return <Upload className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-blue-600">
              {getSourceIcon(ticket.sourceType)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                #{ticket.ticketNumber}
              </h3>
              <Badge 
                variant="outline" 
                className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}
              >
                {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)} Priority
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {ticket.customerName?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700">{ticket.customerName}</span>
          </div>
        </div>

        <div className="mb-3">
          <h4 className="font-medium text-gray-900 mb-1">{ticket.title || 'No Title'}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{ticket.description || 'No Description'}</p>
          {ticket.masterData && (
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {ticket.masterData.categoryName}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ticket.masterData.moduleName}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Modified: {formatDate(ticket.lastModified || ticket.updatedAt)}</span>
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
           
            <span>SLA: {formatDate(ticket.slaDeadline)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status === 'in-progress' ? 'In Progress' : 
               ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1)}
            </Badge>
            {ticket.assignedTo && (
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <User className="h-3 w-3" />
                
                <span>Assigned to {ticket.assignedTo}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {ticket.status === 'open' && !ticket.assignedTo && (
              <Button 
                size="sm" 
                onClick={() => onClaim(ticket._id)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
              >
                Claim Ticket
              </Button>
            )}
            
            {ticket.status === 'in-progress' && ticket.assignedTo && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onStatusUpdate(ticket._id, 'resolved')}
                className="text-xs px-3 py-1 border-green-300 text-green-700 hover:bg-green-50"
              >
                Mark Resolved
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onSelect(ticket)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs px-2 py-1"
            >
              Open Ticket
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};