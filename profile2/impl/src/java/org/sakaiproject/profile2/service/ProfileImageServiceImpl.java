package org.sakaiproject.profile2.service;

import lombok.Setter;
import org.sakaiproject.profile2.dao.ProfileDao;
import org.sakaiproject.profile2.hbm.model.ProfileImageUploaded;
import org.sakaiproject.tool.cover.SessionManager;

public class ProfileImageServiceImpl implements ProfileImageService {


    public Long getCurrentProfileImageId(final String userId) {
        ProfileImageUploaded profileImage = dao.getCurrentProfileImageRecord(userId);
        if (profileImage == null) {
            return null;
        }
        return profileImage.getId();
    }


    public String getProfileImageURL(final String userId, final String eid, final boolean thumbnail) {
        String url = "/direct/profile/"+eid+"/image";

        if (thumbnail) {
            url += "/thumb";
        }

        if (SessionManager.getCurrentSession().getAttribute("profileImageId") == null) {
            resetCachedProfileImageId(userId);
        }

        url += "?_=" + ((Long) SessionManager.getCurrentSession().getAttribute("profileImageId")).toString();

        return url;
    }


    public String resetCachedProfileImageId(final String userId) {
        Long profileImageId = getCurrentProfileImageId(userId);
        if (profileImageId == null) {
            profileImageId = Long.valueOf(0);
        }
        SessionManager.getCurrentSession().setAttribute("profileImageId", profileImageId);

        return profileImageId.toString();
    }

    @Setter
    private ProfileDao dao;
}
