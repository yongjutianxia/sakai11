package org.sakaiproject.portal.util;

import org.sakaiproject.component.cover.ServerConfigurationService;
import java.util.Map;
import java.util.HashMap;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;


public class ExternalHelpSystem {


    private static Log LOG = LogFactory.getLog(ExternalHelpSystem.class);
    private static String MAIN_HELP_TOOL_ID = "__help__";

    public class ExternalHelp {
        private String tool;
        private String url;
        private String label;

        public ExternalHelp(String tool, String url, String label) {
            this.tool = tool;
            this.url = url;
            this.label = label;
        }

        public String getTool() {
            return tool;
        }

        public String getUrl() {
            return url;
        }

        public String getLabel() {
            return label;
        }

        public String toString() {
          return String.format("\"%s\", \"%s\", \"%s\"", tool, label, url);
        }
    }


    private class HelpSet {
        private Map<String, ExternalHelp> help;
        private Map<String, ExternalHelp> news;

        public HelpSet(String userRole) {
            help = readHelpEntries("externalHelp.help." + userRole);
            news = readHelpEntries("externalHelp.news." + userRole);
        }


        public ExternalHelp getHelp(String toolId) { return help.get(toolId); }
        public ExternalHelp getNews(String toolId) { return news.get(toolId); }


        private Map<String, ExternalHelp> readHelpEntries(String basename) {
            int count = ServerConfigurationService.getInt(basename + ".count", 0);

            Map<String, ExternalHelp> result = new HashMap<String, ExternalHelp>(count);

            for (int i = 1; i <= count; i++) {
                String tool = ServerConfigurationService.getString(String.format("%s.%d.tool", basename, i));
                String url = ServerConfigurationService.getString(String.format("%s.%d.url", basename, i));
                String label = ServerConfigurationService.getString(String.format("%s.%d.label", basename, i));

                result.put(tool, new ExternalHelp(tool, url, label));
            }

            return result;
        }


        public String toString() {
            StringBuilder sb = new StringBuilder();

            sb.append("\n");
            sb.append("Help entries:\n");
            for (ExternalHelp entry : help.values()) {
                sb.append("  <" + entry.toString() + ">\n");
            }

            sb.append("News entries:\n");
            for (ExternalHelp entry : news.values()) {
                sb.append("  <" + entry.toString() + ">\n");
            }

            sb.append("\n");

            return sb.toString();
        }
    }


    private boolean enabled;
    private Map<String, HelpSet> roleHelpSets;

    public ExternalHelpSystem() {
        enabled = ServerConfigurationService.getBoolean("externalHelp.enabled", false);

        if (enabled) {
            LOG.info("External help system enabled");
        } else {
            LOG.info("External help system disabled");
            return;
        }

        roleHelpSets = new HashMap<String, HelpSet>();
        String[] userRoles = ServerConfigurationService.getStrings("externalHelp.user-roles");

        if (userRoles == null) {
            return;
        }

        for (String userRole : userRoles) {
            HelpSet roleHelpSet = new HelpSet(userRole);
            roleHelpSets.put(userRole, roleHelpSet);

            LOG.info(String.format("Added help set for role '%s': %s", userRole, roleHelpSet));
        }
    }


    public boolean isActive() {
        return enabled;
    }

    public ExternalHelp getHelp(String toolId, String userRole) {
        if (!roleHelpSets.containsKey(userRole)) {
            return null;
        }

        return roleHelpSets.get(userRole).getHelp(toolId);
    }


    public ExternalHelp getNews(String toolId, String userRole) {
        if (!roleHelpSets.containsKey(userRole)) {
            return null;
        }

        return roleHelpSets.get(userRole).getNews(toolId);
    }


    public ExternalHelp getMainHelp() { return getHelp(MAIN_HELP_TOOL_ID, "global"); }
}
