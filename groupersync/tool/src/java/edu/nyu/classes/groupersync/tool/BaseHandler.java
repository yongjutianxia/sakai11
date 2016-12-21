package edu.nyu.classes.groupersync.tool;

import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.sakaiproject.component.cover.ComponentManager;
import edu.nyu.classes.groupersync.api.GrouperSyncService;
import org.sakaiproject.site.api.Site;
import java.io.IOException;
import java.net.MalformedURLException;
import org.sakaiproject.component.cover.ServerConfigurationService;
import org.sakaiproject.tool.cover.ToolManager;
import java.net.URL;

abstract class BaseHandler {

    protected String buildRequiredSuffix(Site site) {
        String termEid = site.getProperties().getProperty(Site.PROP_SITE_TERM_EID);

        if (termEid == null) {
            termEid = "prj";
        } else {
            termEid = AddressFormatter.formatTerm(termEid);
        }

        return ":" + termEid + ":" + site.getId().substring(0, 4);
    }


    protected GrouperSyncService getGrouperSyncService() {
        GrouperSyncService result = (GrouperSyncService) ComponentManager.get("edu.nyu.classes.groupersync.api.GrouperSyncService");

        if (result == null) {
            throw new RuntimeException("Couldn't get the GrouperSyncService");
        }

        return result;
    }

    protected URL determineBaseURL() throws ServletException {
        String siteId = ToolManager.getCurrentPlacement().getContext();
        String toolId = ToolManager.getCurrentPlacement().getId();

        try {
            return new URL(Configuration.getPortalUrl() + "/site/" + siteId + "/tool/" + toolId + "/");
        } catch (MalformedURLException e) {
            throw new ServletException("Couldn't determine tool URL", e);
        }
    }
}
