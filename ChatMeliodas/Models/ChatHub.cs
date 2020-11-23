using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace ChatMeliodas.Models
{
    public class ChatHub : Hub
    {
        static List<Message> CurrentMessage = new List<Message>();
        static List<Online> CurrentOnline = new List<Online>();

        public void LoginValidator(string name, string pass)
        {
            /*using( DBModel db = new DBModel())
            {
                bool flag = true;
                var userDetail = db.User.Where(x => x.UserName == name && x.Password == pass).FirstOrDefault();
                if (userDetail == null)
                {*/
            bool flag = true;
            Clients.Caller.login(flag);
            /* }
             else
             {
                 Clients.Caller.login(flag);
             }
         } */
        }

        public void Send(int otherId, string message)
        {
            string connectionId = Context.ConnectionId;

            Online receiver = CurrentOnline.Where(x => x.Id == otherId).FirstOrDefault();
            Online sender = null;

            foreach (var userOnline in CurrentOnline)
            {
                foreach (var connId in userOnline.ConnectionIds)
                {
                    if (connId == connectionId)
                    {
                        sender = userOnline;
                        break;
                    }

                }
            }
            if (sender != null)
            {
                foreach (var userOnline in CurrentOnline)
                {
                    /*if (sender == userOnline)
                    {
                        foreach (var connId in userOnline.ConnectionIds)
                        {
                            Clients.Client(connId).sendPrivateMessage(receiver.Id.ToString(), sender.Username, receiver.Username, message);
                        }
                    }*/
                    if (receiver == userOnline)
                    {
                        foreach (var connId in userOnline.ConnectionIds)
                        {
                            Clients.Client(connId).newMessage(message, sender.Id);
                        }
                    }
                }
            }
            
        }

        public System.Threading.Tasks.Task Connect(string UserName, int UserID)
        {
            string connectionId = Context.ConnectionId;

            if (CurrentOnline.Count(x => x.Id == UserID) == 0)
            {
                CurrentOnline.Add(new Online { Username = UserName, Id = UserID, ConnectionIds = new HashSet<string>() });
                Online u = CurrentOnline.Where(x => x.Id == UserID).FirstOrDefault();
                u.ConnectionIds.Add(connectionId);
            }
            else
            {
                Online u = CurrentOnline.Where(x => x.Id == UserID).FirstOrDefault();
                u.ConnectionIds.Add(connectionId);
            }
            Online CurrentUser = CurrentOnline.Where(x => x.Id == UserID).FirstOrDefault();

            foreach (var userOnline in CurrentOnline)
            {
                foreach (var connId in userOnline.ConnectionIds)
                {
                    if (userOnline.Id == UserID)
                    {
                        Clients.Caller.onConnected(userOnline.Id.ToString(), userOnline.Username, CurrentOnline, CurrentMessage, userOnline.Id);
                    }
                    else
                    {
                        Clients.Client(connId).onNewUserConnected(CurrentUser.Id.ToString(), CurrentUser.Username, CurrentUser.Id);
                    }
                }
            }
            return base.OnConnected();
        }

        public void SendPrivateMessage(string toUserId, string message)
        {
            try
            {
                string connectionId = Context.ConnectionId;

                int _toUserId = 0;
                int.TryParse(toUserId, out _toUserId);
                Online receiver = CurrentOnline.Where(x => x.Id == _toUserId).FirstOrDefault();
                if (receiver != null)
                {
                    Online sender = null;

                    foreach (var userOnline in CurrentOnline)
                    {
                        foreach (var connId in userOnline.ConnectionIds)
                        {
                            if (connId == connectionId)
                            {
                                sender = userOnline;
                                break;
                            }

                        }
                    }

                    if (sender != null && receiver != null)
                    {
                        foreach (var userOnline in CurrentOnline)
                        {
                            if (sender == userOnline)
                            {
                                foreach (var connId in userOnline.ConnectionIds)
                                {
                                    Clients.Client(connId).sendPrivateMessage(receiver.Id.ToString(), sender.Username, receiver.Username, message);
                                }
                            }
                            else if (receiver == userOnline)
                            {
                                foreach (var connId in userOnline.ConnectionIds)
                                {
                                    Clients.Client(connId).sendPrivateMessage(sender.Id.ToString(), sender.Username, sender.Username, message);
                                }
                            }
                        }
                    }
                    Message _MessageDeail = new Message { FromUserID = sender.Id, FromUserName = sender.Username, ToUserID = _toUserId, ToUserName = receiver.Username, Messager = message };
                    AddMessageinCache(_MessageDeail);
                }

            }
            catch { }
        }

        public void RequestLastMessage(int FromUserID, int ToUserID)
        {
            List<Message> CurrentChatMessages = (from u in CurrentMessage where ((u.FromUserID == FromUserID && u.ToUserID == ToUserID) || (u.FromUserID == ToUserID && u.ToUserID == FromUserID)) select u).ToList();
            //send to caller user
            Clients.Caller.GetLastMessages(ToUserID, CurrentChatMessages);
        }

        public void SendUserTypingRequest(string toUserId)
        {
            /*
            string strfromUserId = (CurrentOnline.Where(u => u.ConnectionId == Context.ConnectionId).Select(u => u.Id).FirstOrDefault()).ToString();

            int _toUserId = 0;
            int.TryParse(toUserId, out _toUserId);
            List<Online> ToUsers = CurrentOnline.Where(x => x.Id == _toUserId).ToList();

            foreach (var ToUser in ToUsers)
            {
                // send to                                                                                            
                Clients.Client(ToUser.ConnectionId).ReceiveTypingRequest(strfromUserId);
            }
            */
        }

        public override System.Threading.Tasks.Task OnDisconnected(bool stopCalled)
        {
            string connectionId = Context.ConnectionId;

            Online user = null;

            foreach (var userOnline in CurrentOnline)
            {
                foreach (var connId in userOnline.ConnectionIds)
                {
                    if (connId == connectionId)
                    {
                        user = userOnline;
                        break;
                    }

                }
            }

            if (user != null)
            {

                lock (user.ConnectionIds)
                {

                    user.ConnectionIds.RemoveWhere(cid => cid.Equals(connectionId));

                    if (!user.ConnectionIds.Any())
                    {

                        CurrentOnline.Remove(user);

                        // You might want to only broadcast this info if this 
                        // is the last connection of the user and the user actual is 
                        // now disconnected from all connections.
                        Clients.All.onUserDisconnected(user.Id.ToString(), user.Username);
                    }
                }
            }
            return base.OnDisconnected(stopCalled);
        }

        private void AddMessageinCache(Message _MessageDetail)
        {
            /* using (DBMessager dbMessage = new DBMessager())
             {
                 dbMessage.Message.Add(_MessageDetail);
                 dbMessage.SaveChanges();
             }*/
            CurrentMessage.Add(_MessageDetail);
            if (CurrentMessage.Count > 100)
                CurrentMessage.RemoveAt(0);
        }

        public void StartCall(int toUserId)
        {
            var Myconn_id = Context.ConnectionId;
            // int.TryParse(toUserId, out _toUserId);
            //string strfromUserName = (CurrentOnline.Where(u => u.ConnectionId == Context.ConnectionId).Select(u => u.Username).FirstOrDefault()).ToString();
            Online result = CurrentOnline.Where(x => x.Id == toUserId).FirstOrDefault();
            Clients.Caller.StartCallRequest(Myconn_id, toUserId);
        }

        public void StartCallRequest(int toUserId, string my_conn)
        {
            Online result = CurrentOnline.Where(x => x.Id == toUserId).FirstOrDefault();
            Online sender = null;
            foreach (var userOnline in CurrentOnline)
            {
                foreach (var connId in userOnline.ConnectionIds)
                {
                    if( connId == my_conn)
                    {
                        sender = userOnline;
                    }
                }
            }
            if (sender != null)
            {
                Clients.Client(result.ConnectionIds.ElementAt(0)).receiveCallRequest(result.Id, sender.Id, sender.Username);
            }
            //string strfromUserName = (CurrentOnline.Where(u => u.ConnectionId == my_conn).Select(u => u.Username).FirstOrDefault()).ToString();
            //int strfromUserId = (CurrentOnline.Where(u => u.ConnectionId == my_conn).Select(u => u.Id).FirstOrDefault());
            
        }
    }
}