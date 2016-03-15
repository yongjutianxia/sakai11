package org.sakaiproject.gradebookng.tool.actions;


import java.io.Serializable;
import com.fasterxml.jackson.databind.JsonNode;
import java.lang.annotation.Target;
import java.lang.Error;
import java.text.Format;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.validator.routines.DoubleValidator;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.sakaiproject.gradebookng.business.GbRole;
import org.sakaiproject.gradebookng.business.GradeSaveResponse;
import org.sakaiproject.gradebookng.business.util.CourseGradeFormatter;
import org.sakaiproject.gradebookng.business.util.FormatHelper;
import org.sakaiproject.gradebookng.tool.pages.GradebookPage;
import org.sakaiproject.gradebookng.tool.panels.GradeItemCellPanel;
import org.sakaiproject.gradebookng.business.GradebookNgBusinessService;
import org.sakaiproject.service.gradebook.shared.CourseGrade;
import org.sakaiproject.service.gradebook.shared.GradebookInformation;
import org.sakaiproject.tool.gradebook.Gradebook;

public class GradeUpdateAction implements Action, Serializable {

    GradebookNgBusinessService businessService;
    private static final long serialVersionUID = 1L;

    public GradeUpdateAction(GradebookNgBusinessService businessService) {
        this.businessService = businessService;
    }

    // FIXME: We'll use a proper ObjectMapper for these soon.
    private class GradeUpdateResponse implements ActionResponse {
        private String courseGrade;
        private String points;
        private String categoryScore;
        private boolean extraCredit;

        public GradeUpdateResponse(boolean extraCredit, String courseGrade, String points, String categoryScore) {
            this.courseGrade = courseGrade;
            this.categoryScore = categoryScore;
            this.points = points;
            this.extraCredit = extraCredit;
        }

        public String getStatus() {
            return "OK";
        }

        public String toJson() {
            return "{" +
                        "\"courseGrade\": [\"" + courseGrade + "\"," + "\"" + points + "\"]," +
                        "\"categoryScore\": \"" + categoryScore + "\"," +
                        "\"extraCredit\": " + extraCredit +
                    "}";
        }
    }

    private class ArgumentErrorResponse implements ActionResponse {
        private String msg;
        public ArgumentErrorResponse(String msg) {
            this.msg = msg;
        }

        public String getStatus() {
            return "error";
        }

        public String toJson() {
            return String.format("{\"msg\": \"%s\"}", msg);
        }
    }

    private class SaveGradeErrorResponse implements ActionResponse {
        private GradeSaveResponse serverResponse;
        public SaveGradeErrorResponse(GradeSaveResponse serverResponse) {
            this.serverResponse = serverResponse;
        }

        public String getStatus() {
            return "error";
        }

        public String toJson() {
            // TODO map to a reasonable message based on server response
            return String.format("{\"msg\": \"%s\"}", serverResponse.toString());
        }
    }

    private class SaveGradeNoChangeResponse extends EmptyOkResponse {
        public SaveGradeNoChangeResponse() {
        }

        @Override
        public String getStatus() {
            return "nochange";
        }
    }

    @Override
    public ActionResponse handleEvent(JsonNode params, AjaxRequestTarget target) {
        final GradebookPage page = (GradebookPage) target.getPage();

        final String oldGrade = params.get("oldScore").asText();
        final String rawNewGrade = params.get("newScore").asText();

        // perform validation here so we can bypass the backend
        final DoubleValidator validator = new DoubleValidator();

        if (StringUtils.isNotBlank(rawNewGrade) && (!validator.isValid(rawNewGrade) || Double.parseDouble(rawNewGrade) < 0)) {
            target.add(page.updateLiveGradingMessage(page.getString("feedback.error")));

            return new ArgumentErrorResponse("Grade not valid");
        }

        String assignmentId = params.get("assignmentId").asText();
        String studentUuid = params.get("studentId").asText();
        String categoryId = params.has("categoryId") ? params.get("categoryId").asText() : null; 

        final String newGrade = FormatHelper.formatGrade(rawNewGrade);
        
        // for concurrency, get the original grade we have in the UI and pass it into the service as a check
        final GradeSaveResponse result = businessService.saveGrade(Long.valueOf(assignmentId), studentUuid,
                oldGrade, newGrade, params.get("comment").asText());

        if (result.equals(GradeSaveResponse.NO_CHANGE)) {
            target.add(page.updateLiveGradingMessage(page.getString("feedback.saved")));

            return new SaveGradeNoChangeResponse();
        }

        if (!result.equals(GradeSaveResponse.OK) && !result.equals(GradeSaveResponse.OVER_LIMIT)) {
            target.add(page.updateLiveGradingMessage(page.getString("feedback.error")));

            return new SaveGradeErrorResponse(result);
        }

        CourseGrade studentCourseGrade = businessService.getCourseGrade(studentUuid);

        String grade = "-";
        String points = "0";

        if (studentCourseGrade != null) {
            final GradebookInformation settings = businessService.getGradebookSettings();
            final Gradebook gradebook = businessService.getGradebook();
            final CourseGradeFormatter courseGradeFormatter = new CourseGradeFormatter(
                gradebook,
                GbRole.INSTRUCTOR,
                true,
                gradebook.isCoursePointsDisplayed(),
                true);

            grade = courseGradeFormatter.format(studentCourseGrade);
            points = FormatHelper.formatDoubleToDecimal(studentCourseGrade.getPointsEarned());
        }

        String categoryScore = "-";

        if (categoryId != null) {
            Double average = businessService.getCategoryScoreForStudent(Long.valueOf(categoryId), studentUuid);
            categoryScore = FormatHelper.formatDoubleToDecimal(average);
        }

        target.add(page.updateLiveGradingMessage(page.getString("feedback.saved")));

        return new GradeUpdateResponse(
            result.equals(GradeSaveResponse.OVER_LIMIT),
            grade,
            points,
            categoryScore);
    }
}
