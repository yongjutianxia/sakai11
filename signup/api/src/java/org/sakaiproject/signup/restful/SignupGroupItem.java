/*
* Licensed to The Apereo Foundation under one or more contributor license
* agreements. See the NOTICE file distributed with this work for
* additional information regarding copyright ownership.
*
* The Apereo Foundation licenses this file to you under the Educational 
* Community License, Version 2.0 (the "License"); you may not use this file 
* except in compliance with the License. You may obtain a copy of the 
* License at:
*
* http://opensource.org/licenses/ecl2.txt
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

package org.sakaiproject.signup.restful;

/**
 * <p>
 * This class holds the information of sign-up group. It's a wrapper class for
 * SignupGroup
 * </p>
 */

public class SignupGroupItem {

	private String title;

	private String groupId;

	public SignupGroupItem(String title, String groupId) {
		this.title = title;
		this.groupId = groupId;
	}

	public String getGroupId() {
		return groupId;
	}

	/**
	 * this is a setter.
	 * 
	 * @param groupId
	 *            a unique group Id
	 */
	public void setGroupId(String groupId) {
		this.groupId = groupId;
	}

	/**
	 * get the title for the group
	 * 
	 * @return a title
	 */
	public String getTitle() {
		return title;
	}

	/**
	 * this is a setter.
	 * 
	 * @param title
	 *            a name for this group
	 */
	public void setTitle(String title) {
		this.title = title;
	}

}
