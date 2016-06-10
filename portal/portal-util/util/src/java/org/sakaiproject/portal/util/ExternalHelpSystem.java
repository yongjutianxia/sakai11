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
          return String.format("%s : %s : %s", tool, label, url);
        }
    }


    private boolean enabled;
    private Map<String, ExternalHelp> help;
    private Map<String, ExternalHelp> news;


    public ExternalHelpSystem() {
        enabled = ServerConfigurationService.getBoolean("externalHelp.enabled", false);

        if (enabled) {
            LOG.info("External help system enabled");
        } else {
            LOG.info("External help system disabled");
            return;
        }

        help = readHelpEntries("externalHelp.help");
        news = readHelpEntries("externalHelp.news");

        LOG.info("Loaded external help entries:" + help);
        LOG.info("Loaded external news entries:" + news);
    }


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


    public boolean isActive() {
        return enabled;
    }

    public ExternalHelp getHelp(String toolId) {
        return help.get(toolId);
    }

    public ExternalHelp getMainHelp() { return help.get(MAIN_HELP_TOOL_ID); }

    public ExternalHelp getNews(String toolId) {
        return news.get(toolId);
    }
}
