using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ChatMeliodas.Models
{
    public class Message
    {
        public int FromUserID { get; set; }
        public string FromUserName { get; set; }
        public int ToUserID { get; set; }
        public string ToUserName { get; set; }
        public string Messager { get; set; }
    }
}