package org.sakaiproject.gradebookng.tool.model;

import java.util.List;

import org.sakaiproject.gradebookng.business.GbRole;
import org.sakaiproject.gradebookng.business.GradebookNgBusinessService;
import org.sakaiproject.gradebookng.business.exception.GbAccessDeniedException;
import org.sakaiproject.gradebookng.business.model.GbStudentGradeInfo;
import org.sakaiproject.gradebookng.business.util.GbStopWatch;
import org.sakaiproject.service.gradebook.shared.Assignment;
import org.sakaiproject.service.gradebook.shared.CategoryDefinition;
import org.sakaiproject.service.gradebook.shared.GradebookInformation;
import org.sakaiproject.service.gradebook.shared.SortType;

public class GbGradeTableData {
    private List<Assignment> assignments;
    private List<GbStudentGradeInfo> grades;
    private List<CategoryDefinition> categories;
    private GradebookInformation gradebookInformation;
    private GradebookUiSettings uiSettings;
    private GbRole role;

    public GbGradeTableData(GradebookNgBusinessService businessService,
                            GradebookUiSettings settings) {
        final GbStopWatch stopwatch = new GbStopWatch();
        stopwatch.time("GbGradeTableData init", stopwatch.getTime());

        uiSettings = settings;

        SortType sortBy = SortType.SORT_BY_SORTING;
        if (settings.isCategoriesEnabled() && settings.isGroupedByCategory()) {
            // Pre-sort assignments by the categorized sort order
            sortBy = SortType.SORT_BY_CATEGORY;
        }

        try {
            role = businessService.getUserRole();
        } catch (GbAccessDeniedException e) {
            // FIXME handle with error message?
            throw new RuntimeException(e);
        }

        assignments = businessService.getGradebookAssignments(sortBy);
        stopwatch.time("getGradebookAssignments", stopwatch.getTime());

        grades = businessService.buildGradeMatrix(
            assignments,
            settings);
        stopwatch.time("buildGradeMatrix", stopwatch.getTime());

        categories = businessService.getGradebookCategories();
        stopwatch.time("getGradebookCategories", stopwatch.getTime());

        gradebookInformation = businessService.getGradebookSettings();
        stopwatch.time("getGradebookSettings", stopwatch.getTime());
    }

    public List<Assignment> getAssignments() {
        return assignments;
    }

    public List<GbStudentGradeInfo> getGrades() {
        return grades;
    }

    public List<CategoryDefinition> getCategories() {
        return categories;
    }

    public GradebookInformation getGradebookInformation() {
        return gradebookInformation;
    }

    public GradebookUiSettings getUiSettings() {
        return uiSettings;
    }

    public GbRole getRole() {
        return role;
    }
}