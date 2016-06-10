package org.sakaiproject.coursemanagement.impl.job;

import java.io.InputStream;
import java.io.FileInputStream;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.sakaiproject.authz.cover.AuthzGroupService;
import org.sakaiproject.event.cover.EventTrackingService;
import org.sakaiproject.event.cover.UsageSessionService;
import org.sakaiproject.tool.api.Session;
import org.sakaiproject.tool.cover.SessionManager;
import org.sakaiproject.component.cover.ServerConfigurationService;

import org.jdom.Element;
import java.util.List;
import org.jdom.JDOMException;
import org.jdom.xpath.XPath;
import org.jdom.Document;
import java.util.Iterator;



/**
 * Based on ClassPathCMSyncJob.java:
 * A sample quartz job to synchronize the CM data in Sakai's hibernate impl with an
 * xml file available in the classpath.
 * 
 * @author <a href="mailto:jholtzman@berkeley.edu">Josh Holtzman</a>
 *
 * This one adapted for NYU by jb@nyu.edu
 *
 * The only difference is that the xml stream can be anywhere on the filesystem
 */
public class NYUCMSyncJob extends CmSynchronizer implements Job {
	private static final Log log = LogFactory.getLog(NYUCMSyncJob.class);

	public void init() {
		if(log.isInfoEnabled()) log.info("init()");
	}
	
	public void destroy() {
		if(log.isInfoEnabled()) log.info("destroy()");
	}

	/**
	 * {@inheritDoc}
	 */
	public InputStream getXmlInputStream() {
	    String pathToXml = getPathToXml();

	    try {
		return new FileInputStream(pathToXml);
	    } catch (java.io.FileNotFoundException fnfe) {
		log.warn("Can't find Course Management sync file at: " + pathToXml);
		return null;
	    }
	}

	/**
	 * {@inheritDoc}
	 */
	public void execute(JobExecutionContext arg0) throws JobExecutionException {
		if(log.isInfoEnabled()) log.info("NYU sync job executing ...");

		if(log.isInfoEnabled()) log.info("NYU sync job: logging in ...");
		loginToSakai();

		if(log.isInfoEnabled()) log.info("NYU sync job: syncing ...");
		syncAllCmObjects();

		if(log.isInfoEnabled()) log.info("NYU sync job: logging out ...");
		logoutFromSakai();

		if(log.isInfoEnabled()) log.info("NYU sync job: done!");
	}
		
	protected void loginToSakai() {
	    Session sakaiSession = SessionManager.getCurrentSession();
		sakaiSession.setUserId("admin");
		sakaiSession.setUserEid("admin");

		// establish the user's session
		UsageSessionService.startSession("admin", "127.0.0.1", "CMSync");
		
		// update the user's externally provided realm definitions
		AuthzGroupService.refreshUser("admin");

		// post the login event
		EventTrackingService.post(EventTrackingService.newEvent(UsageSessionService.EVENT_LOGIN, null, true));
	}

	protected void reconcileCourseSets(Document doc) {
		super.reconcileCourseSets(doc);

		// Handle our new course-set-membership entries too.

		try {
			XPath docsPath = XPath.newInstance("/cm-data/course-set-membership/member");
			List items = docsPath.selectNodes(doc);

			for(Iterator iter = items.iterator(); iter.hasNext();) {
				Element element = (Element)iter.next();
				String courseSet = element.getChildText("courseset");
				String eid = element.getChildText("eid");
				String memberType = element.getChildText("membertype");

				if ("canonical".equals(memberType)) {
					cmAdmin.addCanonicalCourseToCourseSet(courseSet, eid);
				} else {
					cmAdmin.addCourseOfferingToCourseSet(courseSet, eid);
				}
			}
		} catch (JDOMException jde) {
			log.error(jde);
		}
	}


	protected void reconcileCurrentAcademicSessions(Document doc) {
          if(log.isInfoEnabled()) log.info("Leaving current academic sessions alone");
	}


	protected void logoutFromSakai() {
		// post the logout event
		EventTrackingService.post(EventTrackingService.newEvent(UsageSessionService.EVENT_LOGOUT, null, true));
	}

	public String getPathToXml() {
	    String prop = "edu.nyu.classes.provisioning.xmlPath";
	    String pathToXml = ServerConfigurationService.getString(prop);

	    if (pathToXml == null || "".equals(pathToXml)) {
		throw new RuntimeException("ERROR: NYU sync job failed: property missing from sakai.properties: " + prop);
	    }

	    return pathToXml;
	}
}
