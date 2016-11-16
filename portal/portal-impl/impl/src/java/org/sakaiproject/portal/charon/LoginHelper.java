package org.sakaiproject.portal.charon;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

public class LoginHelper {

    public static void resetNavMinimizedCookie(HttpServletResponse response) {
        Cookie navMinimizedCookie = new Cookie("sakai_nav_minimized", "false");
        navMinimizedCookie.setSecure(true);
        navMinimizedCookie.setPath("/");
        navMinimizedCookie.setMaxAge(-1);
        response.addCookie(navMinimizedCookie);
    }
}
