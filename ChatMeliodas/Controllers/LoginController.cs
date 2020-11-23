using ChatMeliodas.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ChatMeliodas.Controllers
{
    public class LoginController : Controller
    {
        public static int aux = 0;
        // GET: Login
        public ActionResult Login()
        {
            return View();
        }
        [HttpPost]
        public ActionResult Autorize(User user)
        {
          /*  using (LoginDB db = new LoginDB())
            {
                var userDetail = db.User.Where(x => x.UserName == user.UserName && x.Password == user.Password).FirstOrDefault();
                if (userDetail == null)
                {
                    return View("Login", user);
                }
                else
                {
          */
            Session["userId"] = aux.ToString();
            Session["userName"] = user.UserName;
            aux++;
             //   }
           // }
            return RedirectToAction("Index", "Home");
        }
    }
}