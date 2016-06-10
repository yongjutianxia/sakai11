package edu.nyu.classes.nyuhome.feeds;

import lombok.*;
import lombok.experimental.Builder;


import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import edu.nyu.classes.nyuhome.api.QueryUser;
import edu.nyu.classes.nyuhome.api.DataFeedEntry;
import edu.nyu.classes.nyuhome.api.Resolver;

import org.sakaiproject.component.cover.ComponentManager;

import org.sakaiproject.time.cover.TimeService;
import org.sakaiproject.time.api.Time;
import org.sakaiproject.assignment.api.AssignmentService;
import org.sakaiproject.assignment.api.Assignment;
import org.sakaiproject.assignment.api.AssignmentContent;
import org.sakaiproject.entity.api.ResourceProperties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Builder
class AssignmentResponse implements DataFeedEntry {
    private Date openDate;
    private Date lastModified;

    @Getter private Date dueDate;
    @Getter private String id;
    @Getter private String creator__userid;
    @Getter private String context__siteid;
    @Getter private String title;
    @Getter private String instructions;
    @Getter private String reference;
    @Getter private String toolUrl;


    public Date getSortDate() {
        if (openDate.compareTo(lastModified) <= 0) {
            return openDate;
        } else {
            return lastModified;
        }
    }
}


public class AssignmentFeed extends SakaiToolFeed {
    private static final Logger LOG = LoggerFactory.getLogger(AssignmentFeed.class);

    public List<DataFeedEntry> getUserData(QueryUser user, Resolver resolver, int maxAgeDays, int maxResults) {
        List<DataFeedEntry> result = new ArrayList<DataFeedEntry>();
        MaxAgeAndCountFilter filter = new MaxAgeAndCountFilter(maxAgeDays, maxResults);

        AssignmentService assignmentService = (AssignmentService) ComponentManager.get("org.sakaiproject.assignment.api.AssignmentService");

        for (String siteId : user.listSites()) {
            List<Assignment> assignments = assignmentService.getListAssignmentsForContext(siteId);

            for (Assignment assignment : assignments) {
                if (isAssignmentVisible(assignment)) {
                    AssignmentResponse response = prepareAssignment(assignment);

                    if (filter.accept(response.getSortDate())) {
                        result.add(response);
                        resolver.addUser(response.getCreator__userid());
                        resolver.addSite(response.getContext__siteid());
                    }
                }
            }

            resolver.addSite(siteId);
        }

        return result;
    }


    private AssignmentResponse prepareAssignment(Assignment assignment) {
        AssignmentContent content = assignment.getContent();

        return new AssignmentResponse.AssignmentResponseBuilder()
            .openDate(new Date(assignment.getOpenTime().getTime()))
            .lastModified(new Date(assignment.getTimeLastModified().getTime()))
            .dueDate(new Date(assignment.getDueTime().getTime()))
            .id(assignment.getId())
            .creator__userid(content.getCreator())
            .context__siteid(content.getContext())
            .title(content.getTitle())
            .instructions(content.getInstructions())
            .reference(content.getReference())
            .toolUrl(buildUrl(content.getContext(), "sakai.assignment.grades"))
            .build();
    }


    private boolean isAssignmentVisible(Assignment assignment) {
        Time currentTime = TimeService.newTime();
            
        String deletedProperty = assignment.getProperties().getProperty(ResourceProperties.PROP_ASSIGNMENT_DELETED);
        boolean isDeleted = !((deletedProperty == null) || "".equals(deletedProperty));

        return !isDeleted &&
            assignment.getOpenTime() != null &&
            currentTime.after(assignment.getOpenTime()) &&
            !assignment.getDraft();
    }

}
