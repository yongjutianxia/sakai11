package org.sakaiproject.portal.charon.handlers;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sakaiproject.portal.api.PortalHandlerException;
import org.sakaiproject.portal.charon.LoginHelper;
import org.sakaiproject.tool.api.Session;

import org.sakaiproject.util.ExternalTrustedEvidence;
import org.sakaiproject.user.api.Evidence;
import org.sakaiproject.user.api.Authentication;
import org.sakaiproject.event.cover.UsageSessionService;
import org.sakaiproject.user.cover.AuthenticationManager;
import org.sakaiproject.user.api.AuthenticationException;
import org.sakaiproject.user.api.AuthenticationMissingException;
import org.sakaiproject.component.cover.ComponentManager;
import org.sakaiproject.portal.util.ErrorReporter;
import org.sakaiproject.portal.api.PortalRenderContext;

import org.sakaiproject.component.cover.ServerConfigurationService;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import edu.nyu.classes.saml.api.SamlService;
import edu.nyu.classes.saml.api.SamlAuthResponse;

import java.io.IOException;
import java.lang.management.ThreadInfo;
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;

public class SamlLoginHandler extends BasePortalHandler
{

  private static final String URL_FRAGMENT = "samllogin";
  private static final Log log = LogFactory.getLog(SamlLoginHandler.class);


  public SamlLoginHandler()
  {
    setUrlFragment(SamlLoginHandler.URL_FRAGMENT);
  }


    // Borrowed from http://crunchify.com/how-to-generate-java-thread-dump-programmatically/
    private static String crunchifyGenerateThreadDump() {
            final StringBuilder dump = new StringBuilder();
            final ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
            final ThreadInfo[] threadInfos = threadMXBean.getThreadInfo(threadMXBean.getAllThreadIds(), 100);
            for (ThreadInfo threadInfo : threadInfos) {
                dump.append('"');
                dump.append(threadInfo.getThreadName());
                dump.append("\" ");
                final Thread.State state = threadInfo.getThreadState();
                dump.append("\n   java.lang.Thread.State: ");
                dump.append(state);
                final StackTraceElement[] stackTraceElements = threadInfo.getStackTrace();
                for (final StackTraceElement stackTraceElement : stackTraceElements) {
                    dump.append("\n        at ");
                    dump.append(stackTraceElement);
                }
                dump.append("\n\n");
            }
            return dump.toString();
        }


  @Override
  public int doPost(String[] parts, HttpServletRequest req, HttpServletResponse res,
                    Session session) throws PortalHandlerException
  {
    if ((parts.length == 2) && (parts[1].equals(SamlLoginHandler.URL_FRAGMENT))) {
      try {
        SamlService saml = (SamlService)ComponentManager.get("edu.nyu.classes.saml.api.SamlService");

        // "START_SAML"
        System.err.println("\n*** DEBUG " + System.currentTimeMillis() + "[SamlLoginHandler.java:55 424e46]: " + "\n    'START_SAML' => " + ("START_SAML") + "\n");

        SamlAuthResponse auth = saml.handleSamlAuthentication(req);

        // "END_SAML"
        System.err.println("\n*** DEBUG " + System.currentTimeMillis() + "[SamlLoginHandler.java:60 6540b6]: " + "\n    'END_SAML' => " + ("END_SAML") + "\n");

        if (auth == null) {
          throw new AuthenticationException("Couldn't validate your SSO session.");
        }

        Thread showDump = new Thread () {
            public void run() {
                for (int i = 0; i < 10; i++) {
                    System.err.println(crunchifyGenerateThreadDump());
                    try { Thread.sleep(2000); } catch (InterruptedException e) {};
                }
            }
        };

        showDump.start();

        Evidence e = new ExternalTrustedEvidence(auth.getUser());
        Authentication a = null;

        try {

            // "START_AUTH"
            System.err.println("\n*** DEBUG " + System.currentTimeMillis() + "[SamlLoginHandler.java:72 361547]: " + "\n    'START_AUTH' => " + ("START_AUTH") + "\n");


          a = AuthenticationManager.authenticate(e);

          // "END_AUTH"
          System.err.println("\n*** DEBUG " + System.currentTimeMillis() + "[SamlLoginHandler.java:78 cf117c]: " + "\n    'END_AUTH' => " + ("END_AUTH") + "\n");

        } catch (AuthenticationMissingException ex) {
          throw new AuthenticationException("User not found for '" + auth.getUser() + "'");
        }

        // "START_LOGIN"
        System.err.println("\n*** DEBUG " + System.currentTimeMillis() + "[SamlLoginHandler.java:85 57af3d]: " + "\n    'START_LOGIN' => " + ("START_LOGIN") + "\n");

        if (UsageSessionService.login(a, req)) {
          String destination = "/portal";

          if (auth.getDestination() != null) {
            destination = auth.getDestination();
          }

          LoginHelper.resetNavMinimizedCookie(res);

          // "SEND_REDIRECT"
          System.err.println("\n*** DEBUG " + System.currentTimeMillis() + "[SamlLoginHandler.java:97 f54ee2]: " + "\n    'SEND_REDIRECT' => " + ("SEND_REDIRECT") + "\n");

          res.sendRedirect(destination);

          return END;
        } else {

            // "LOGIN_FAIL"
            System.err.println("\n*** DEBUG " + System.currentTimeMillis() + "[SamlLoginHandler.java:102 76b7cb]: " + "\n    'LOGIN_FAIL' => " + ("LOGIN_FAIL") + "\n");


          throw new AuthenticationException("Couldn't log you in");
        }
      } catch (Exception e) {
        try {
          handleSSOError(req, res, session, e);
          return END;
        } catch (Exception ex) {
          throw new PortalHandlerException(ex);
        }
      }
    }

    return NEXT;
  }


  private void handleSSOError(HttpServletRequest req, HttpServletResponse res, Session session,
                              Exception e) throws IOException
  {
    log.error("SSO error", e);

    PortalRenderContext rcontext = portal.startPageContext("", "SAML Login", null, req);
    portal.sendResponse(rcontext, res, "samlfailed", null);
  }


  @Override
  public int doGet(String[] parts, HttpServletRequest req, HttpServletResponse res,
                   Session session) throws PortalHandlerException
  {
    return NEXT;
  }
}
