package org.sakaiproject.profile2.tool.entityprovider;

import lombok.Setter;
import org.apache.commons.codec.binary.Base64;
import org.json.simple.JSONObject;
import org.sakaiproject.entitybroker.DeveloperHelperService;
import org.sakaiproject.entitybroker.EntityView;
import org.sakaiproject.entitybroker.entityprovider.EntityProvider;
import org.sakaiproject.entitybroker.entityprovider.EntityProviderManager;
import org.sakaiproject.entitybroker.entityprovider.annotations.EntityCustomAction;
import org.sakaiproject.entitybroker.entityprovider.capabilities.ActionsExecutable;
import org.sakaiproject.entitybroker.entityprovider.capabilities.AutoRegisterEntityProvider;
import org.sakaiproject.entitybroker.entityprovider.capabilities.Describeable;
import org.sakaiproject.entitybroker.entityprovider.capabilities.Outputable;
import org.sakaiproject.entitybroker.entityprovider.extension.Formats;
import org.sakaiproject.entitybroker.util.AbstractEntityProvider;
import org.sakaiproject.profile2.logic.ProfileImageLogic;
import org.sakaiproject.tool.cover.SessionManager;
import org.sakaiproject.user.api.User;
import org.sakaiproject.user.cover.UserDirectoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.UUID;

public class ProfileImageEntityProvider extends AbstractEntityProvider implements EntityProvider, AutoRegisterEntityProvider, Outputable, Describeable, ActionsExecutable {

    private static final Logger LOG = LoggerFactory.getLogger(ProfileImageEntityProvider.class);

    @Setter
    private ProfileImageLogic imageLogic;

    @Override
    public String[] getHandledOutputFormats() {
        return new String[] { Formats.JSON };
    }

    @Override
    public String getEntityPrefix() {
        return "profile-image";
    }

    @EntityCustomAction(action = "upload", viewKey = EntityView.VIEW_NEW)
    public String upload(EntityView view, Map<String, Object> params) {
        JSONObject result = new JSONObject();

        result.put("status", "ERROR");

        if (!checkCSRFToken(params)) {
            return result.toJSONString();
        }

        User currentUser = UserDirectoryService.getCurrentUser();
        String currentUserId = currentUser.getId();

        if (currentUserId == null) {
            LOG.warn("Access denied");
            return result.toJSONString();
        }

        String mimeType = "image/png";
        // TODO: something else for file name?
        String fileName = UUID.randomUUID().toString();
        String base64 = (String) params.get("base64");
        byte[] imageBytes = Base64.decodeBase64(base64.getBytes());

        if (imageLogic.setUploadedProfileImage(currentUserId, imageBytes, mimeType, fileName)) {
            result.put("status", "SUCCESS");
        }

        return result.toJSONString();
    }

    private boolean checkCSRFToken(Map<String, Object> params) {
        Object sessionToken = SessionManager.getCurrentSession().getAttribute("sakai.csrf.token");

        if (sessionToken == null || !sessionToken.equals(params.get("sakai_csrf_token"))) {
            LOG.warn("CSRF token validation failed");
            return false;
        }

        return true;
    }
}

