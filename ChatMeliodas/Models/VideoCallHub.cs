using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace ChatMeliodas.Models
{
    public class VideoCallHub : Hub
    {
        static List<OnlineVideo> CurrentOnline = new List<OnlineVideo>();
        public void Send(int otherId, string message)
        {
            OnlineVideo result = CurrentOnline.Where(x => x.Id == otherId).FirstOrDefault();
            // Call the addNewMessageToPage method to update clients.
            Clients.Client(result.ConnectionId).newMessage(message);
        }

        public void ShareScreen(int otherId, string message)
        {
            OnlineVideo result = CurrentOnline.Where(x => x.Id == otherId).FirstOrDefault();
            // Call the addNewMessageToPage method to update clients.
            Clients.Client(result.ConnectionId).shareScreen(message);
        }

        public void HangupCall(int otherUserId)
        {
            OnlineVideo me = CurrentOnline.Where(x => x.ConnectionId == Context.ConnectionId).FirstOrDefault();
            OnlineVideo result = CurrentOnline.Where(x => x.Id == otherUserId).FirstOrDefault();
            Clients.Client(result.ConnectionId).userDisconnected(me.Username);
        }

        public System.Threading.Tasks.Task Connect(string UserName, int UserID)
        {
            string connectionId = Context.ConnectionId;

            if (CurrentOnline.Count(x => x.Id == UserID) == 0)
            {
                CurrentOnline.Add(new OnlineVideo { Username = UserName, Id = UserID, ConnectionId = connectionId });
            }
            return base.OnConnected();
        }

        public override System.Threading.Tasks.Task OnDisconnected(bool stopCalled)
        {
            string connectionId = Context.ConnectionId;
            
                 var item = CurrentOnline.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);
            if (item != null)
            {
                CurrentOnline.Remove(item);
            }
           return base.OnDisconnected(stopCalled);
        }
    }
}