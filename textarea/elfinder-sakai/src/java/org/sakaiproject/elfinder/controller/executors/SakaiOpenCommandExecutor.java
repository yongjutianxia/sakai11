package org.sakaiproject.elfinder.controller.executors;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;

import org.json.JSONObject;

import org.sakaiproject.elfinder.sakai.SakaiFsService;
import org.sakaiproject.elfinder.sakai.content.ContentSiteVolumeFactory;

import cn.bluejoe.elfinder.controller.executors.OpenCommandExecutor;
import cn.bluejoe.elfinder.service.FsService;
import cn.bluejoe.elfinder.service.FsItem;
import cn.bluejoe.elfinder.service.FsVolume;

public class SakaiOpenCommandExecutor extends OpenCommandExecutor
{
	@Override
	public void execute(FsService fsService, HttpServletRequest request, ServletContext servletContext, JSONObject json) throws Exception {
		if (fsService instanceof SakaiFsService) {
			SakaiFsService sakaiService = (SakaiFsService)fsService;

			FsItem item = sakaiService.fromHash(request.getParameter("target"));

			FsVolume volume = item.getVolume();

			if (volume instanceof ContentSiteVolumeFactory.ContentSiteVolume) {
				ContentSiteVolumeFactory.ContentSiteVolume sakaiVolume = (ContentSiteVolumeFactory.ContentSiteVolume)volume;

				sakaiService.setCurrentSite(sakaiVolume.getSiteId());
			}
		}

		super.execute(fsService, request, servletContext, json);
	}
}
