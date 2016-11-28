package org.sakaiproject.portal.charon.handlers;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.sakaiproject.authz.cover.SecurityService;
import org.sakaiproject.email.cover.EmailService;
import org.sakaiproject.portal.api.PortalHandlerException;
import org.sakaiproject.tool.api.Session;

public class TestEmailHandler extends BasePortalHandler
{
	private static final String URL_FRAGMENT = "test-emails";

	public TestEmailHandler()
	{
		setUrlFragment(URL_FRAGMENT);
	}


	@Override
	public int doGet(String[] parts, HttpServletRequest req,
		HttpServletResponse res, Session session)
		throws PortalHandlerException
	{
		if ((parts.length == 2) && (parts[1].equals(URL_FRAGMENT)))
		{
			if (SecurityService.isSuperUser()) {
				try {
					res.setContentType("text/plain");
					res.getWriter().write("Recently logged test emails\n");
					res.getWriter().write("===========================\n");
					res.getWriter().write(EmailService.getInstance().getTestMessages());

					return END;
				} catch (IOException e) {
					throw new RuntimeException(e);
				}
			} else {
				throw new RuntimeException("Access denied");
			}
		}
		return NEXT;
	}

	@Override
	public int doPost(String[] parts, HttpServletRequest req,
		HttpServletResponse res, Session session)
		throws PortalHandlerException {
		return NEXT;
	}
}
