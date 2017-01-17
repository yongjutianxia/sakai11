package org.sakaiproject.site.tool;

import java.util.List;

import lombok.Data;

/**
 * Stores some extracted data about a site, used by the membership tool
 * 
 * @author Steve Swinsburg (steve.swinsburg@gmail.com)
 *
 */
@Data
public class MembershipSiteMetadata {

	private String siteId;
	private String term;
	private String siteStatus;
	
	private String instructorEids;
	private List<String> groupSectionEids; //needs to be processed in the vm
}
