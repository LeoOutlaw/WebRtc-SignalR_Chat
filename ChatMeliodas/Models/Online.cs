using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ChatMeliodas.Models
{
    public class Online
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public HashSet<string> ConnectionIds { get; set; }
    }
}