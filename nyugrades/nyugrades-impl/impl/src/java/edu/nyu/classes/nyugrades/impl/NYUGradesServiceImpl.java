package edu.nyu.classes.nyugrades.impl;

import edu.nyu.classes.nyugrades.api.DBService;
import edu.nyu.classes.nyugrades.api.Grade;
import edu.nyu.classes.nyugrades.api.NYUGradesService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.sakaiproject.component.cover.ComponentManager;
import org.sakaiproject.tool.api.Session;
import org.sakaiproject.site.api.SiteService;
import org.sakaiproject.site.api.Site;
import org.sakaiproject.service.gradebook.shared.GradebookService;
import org.sakaiproject.coursemanagement.api.CourseManagementService;
import org.sakaiproject.coursemanagement.api.Membership;

import edu.nyu.classes.nyugrades.api.Grade;
import edu.nyu.classes.nyugrades.api.GradeSet;
import edu.nyu.classes.nyugrades.api.SectionNotFoundException;
import edu.nyu.classes.nyugrades.api.SiteNotFoundForSectionException;
import edu.nyu.classes.nyugrades.api.MultipleSectionsMatchedException;
import edu.nyu.classes.nyugrades.api.MultipleSitesFoundForSectionException;


public class NYUGradesServiceImpl implements NYUGradesService
{
    private DBService db;
    private SiteService siteService;
    private GradebookService gradebookService;
    private CourseManagementService courseManagementService;

    private static final Log LOG = LogFactory.getLog(NYUGradesServiceImpl.class);

    private String MISSING_EMPLID = "N000000000";


    // When we build our mapping from Net ID to Empl ID, we essentially want to execute a query like:
    //
    //   SELECT netid, emplid from sometable where netid in (<biglist>)
    //
    // But since we'll often work with large lists of Net IDs, <biglist> could
    // become large.  To limit the overall size of our SQL, we look up Net IDs
    // in batches of MAX_NETID_LOOKUPS size.
    private int MAX_NETID_LOOKUPS = 200;


    public void init()
    {
        db = (DBService) ComponentManager.get("edu.nyu.classes.nyugrades.api.DBService");
        siteService = (SiteService) ComponentManager.get("org.sakaiproject.site.api.SiteService");
        gradebookService = (GradebookService) ComponentManager.get("org.sakaiproject.service.gradebook.GradebookService");
        courseManagementService = (CourseManagementService) ComponentManager.get("org.sakaiproject.coursemanagement.api.CourseManagementService");
    }


    // Provider lists are strings containing realm names separated by '+' characters.
    private List<String> buildProviderLikeClauses(String section)
    {
        List<String> clauses = new ArrayList<String>();

        String escaped = section.replace("_", "\\_");

        clauses.add(escaped);               // The sole provider
        clauses.add(escaped + "+%");        // At the beginning of the list
        clauses.add("%+" + escaped);        // At the end of a list
        clauses.add("%+" + escaped + "+%"); // In the middle of a list

        return clauses;
    }


    private String buildSQLForSection(String sectionEid, List<String> likeClauses)
    {
        likeClauses.addAll(buildProviderLikeClauses(sectionEid));

        StringBuilder whereClause = new StringBuilder();

        for (String clause : likeClauses) {
            if (whereClause.length() > 0) {
                whereClause.append(" OR ");
            }

            whereClause.append("provider_id LIKE ?");

            if (db.isOracle()) {
                whereClause.append(" ESCAPE '\\'");
            }
        }

        return ("SELECT realm_id FROM sakai_realm where realm_key in (" +
                "  SELECT realm_key FROM sakai_realm_provider WHERE " + whereClause.toString() +
                ")");
    }


    private Pattern realmRegexp = Pattern.compile("(?i)^/site/([^/]+)$");


    private String getSiteId(String sectionEid)
        throws SiteNotFoundForSectionException, MultipleSitesFoundForSectionException
    {
        List<String> likeClauses = new ArrayList<String>();
        String sql = buildSQLForSection(sectionEid, likeClauses);

        LOG.debug("SQL is " + sql);
        LOG.debug("Clauses are " + likeClauses);

        List<Object[]> rows = db.executeQuery(sql, likeClauses.toArray(new Object[0]));

        if (rows.isEmpty()) {
            throw new SiteNotFoundForSectionException(sectionEid);
        }

        // The logic here is a bit funny.  We check all results because we want
        // to throw an error if more than one site contains a given section.  We
        // can't do a simple size check on the result, though, because a given
        // section might be attached to several groups within a site.  We skip
        // over those entries because they won't match realmRegexp.
        String result = null;
        for (Object[] row : rows) {
            String realm_id = (String)row[0];
            Matcher m = realmRegexp.matcher(realm_id);
            if (m.matches()) {
                if (result == null) {
                    result = m.group(1);
                } else {
                    throw new MultipleSitesFoundForSectionException(sectionEid);
                }
            }
        }

        if (result != null) {
            return result;
        } else {
            throw new SiteNotFoundForSectionException(sectionEid);
        }
    }


    private boolean isSitePublished(String siteId)
    {
        try {
            Site site = siteService.getSite(siteId);
            return (site != null && site.isPublished());
        } catch (org.sakaiproject.exception.IdUnusedException e) {
            return false;
        }
    }


    public String findSingleSection(String courseId,
                                    String strm,
                                    String sessionCode,
                                    String classSection)
        throws SectionNotFoundException, MultipleSectionsMatchedException
    {
        List<Object[]> rows = db.executeQuery("SELECT stem_name FROM NYU_T_COURSE_CATALOG " +
                                              "WHERE crse_id = ? AND strm = ? AND session_code = ? AND class_section = ?",
                                              courseId,
                                              strm,
                                              sessionCode,
                                              classSection);

        if (rows.isEmpty()) {
            throw new SectionNotFoundException("No section found");
        }

        if (rows.size() > 1) {
            throw new MultipleSectionsMatchedException("More than one sections found");
        }

        return ((String) rows.get(0)[0]).replace(":", "_");
    }


    private void filterSingleSection(Map<String, String> grades, String sectionEid)
    {
        Set<String> sectionMembers = new HashSet<String>();

        for (Membership m : courseManagementService.getSectionMemberships(sectionEid)) {
            if ("S".equals(m.getRole())) {
                sectionMembers.add(m.getUserId());
            }
        }

        grades.keySet().retainAll(sectionMembers);
    }


    private Map<String, String> pullGradesFromGradebook(String siteId)
    {
        // get the calculated grades
        Map<String, String> grades = new HashMap<String, String>(gradebookService.getCalculatedCourseGrade(siteId));
        Map<String, String> eCourseGrade = gradebookService.getEnteredCourseGrade(siteId);

        // override any grades the instructor has manually set
        for (Map.Entry<String, String> entry : eCourseGrade.entrySet()) {
            grades.put(entry.getKey(), entry.getValue());
        }

        return grades;
    }


    public GradeSet getGradesForSection(String sectionEid)
        throws SiteNotFoundForSectionException, MultipleSitesFoundForSectionException
    {
        String siteId = getSiteId(sectionEid);

        if (!isSitePublished(siteId)) {
            throw new SiteNotFoundForSectionException(sectionEid);
        }

        Map grades = pullGradesFromGradebook(siteId);

        filterSingleSection((Map<String, String>) grades, sectionEid);

        return resolveNetIds((Map<String, String>) grades);
    }


    private Map<String, String> buildNetIdMap(Set<String> netIdSet) {
        Map<String, String> result = new HashMap<String, String>();

        List<String> netIds = new ArrayList<String>();
        netIds.addAll(netIdSet);

        for (int offset = 0; offset < netIds.size(); offset += MAX_NETID_LOOKUPS) {
            int upper = Math.min(netIds.size(), offset + MAX_NETID_LOOKUPS);

            List<String> subList = netIds.subList(offset, upper);

            StringBuilder placeholders = new StringBuilder();
            for (String netId : subList) {
                if (placeholders.length() > 0) {
                    placeholders.append(", ");
                }

                placeholders.append("?");
            }

            // NYU_T_STUDENT_ENROLLMENTS has one row per section for each user,
            // but their emplid will be the same in each.  Use MIN just to
            // choose arbitrarily.
            String sql = String.format("SELECT MIN(emplid), netid" +
                                       " FROM nyu_t_student_enrollments" +
                                       " WHERE netid in (%s)" +
                                       " GROUP BY netid",
                                       placeholders.toString());

            List<Object[]> rows = db.executeQuery(sql , subList.toArray(new Object[0]));

            for (Object[] row : rows) {
                String emplId = (String)row[0];
                String netId = (String)row[1];

                result.put(netId, emplId);
            }
        }

        return result;
    }


    public GradeSet resolveNetIds(Map<String, String> grades)
    {
        Map<String, String> netIdToEmpId = buildNetIdMap((Set<String>)grades.keySet());
        List<Grade> gradeList = new ArrayList<Grade>();

        // getImportCourseGrade returns a Map<String, String> even though it doesn't use generics.
        for (Object key : grades.keySet()) {
            String netId = (String) key;

            String emplid = MISSING_EMPLID;

            if (netIdToEmpId.containsKey(netId)) {
                emplid = netIdToEmpId.get(netId);
            } else {
                LOG.warn("No Employee ID could be found for Net ID: " + netId);
            }

            gradeList.add(new Grade(netId, emplid, (String)grades.get(key)));
        }

        return new GradeSet(gradeList);
    }
}
