/**********************************************************************************
 * Copyright 2008 Sakai Foundation
 *
 * Licensed under the Educational Community License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 **********************************************************************************/
package org.sakaiproject.email.api;

import org.sakaiproject.component.cover.ServerConfigurationService;

import java.util.Collection;
import java.util.Properties;

import javax.mail.Address;
import javax.mail.MessagingException;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import java.io.UnsupportedEncodingException;


public class NYUEmailUtils
{
  private static InternetAddress addressFor(String address, String name)
  {
    if (address == null || "".equals(address)) {
      return null;
    }

    try {
      return (name == null || "".equals(name)) ?
        new InternetAddress(address) :
        new InternetAddress(address, name);
    } catch (AddressException e) {
      e.printStackTrace();
      return null;
    } catch (UnsupportedEncodingException e) {
      e.printStackTrace();
      return null;
    }
  }


  private static void rewriteFromAddress(MimeMessage msg)
  {
    InternetAddress fromAddress =
      addressFor(ServerConfigurationService.getString("nyu.overrideFromAddress"),
                 ServerConfigurationService.getString("nyu.overrideFromName"));

    InternetAddress replyToAddress =
      addressFor(ServerConfigurationService.getString("nyu.overrideReplyToAddress"),
                 ServerConfigurationService.getString("nyu.overrideReplyToName"));

    try {
      if (fromAddress != null) {
        msg.setFrom(fromAddress);
      }

      if (replyToAddress != null) {
        msg.setReplyTo(new Address[] { replyToAddress });
      }
    } catch (MessagingException e) {
      e.printStackTrace();
    }
  }


  private static boolean shouldPreserveAddresses(Collection<String> headers)
  {
    if (headers != null)
      {
        for (String header : headers)
          {
            if ("X-NYUClasses-Preserve-Addresses: true".equals(header))
              {
                return true;
              }
          }
      }

    return false;
  }


  public static void conditionalSmtpFromRewrite(Collection<String> headers, Properties sessionProps)
  {
    try {
      // Extract the From address from the list of headers (ick)
      String fromHeader = "From: ";
      for (String header : headers) {
        if (header.startsWith(fromHeader)) {
          String emailAddress = header.substring(fromHeader.length());
          conditionalSmtpFromRewrite(headers, sessionProps, (new InternetAddress(emailAddress)).getAddress());
          return;
        }
      }
    } catch (AddressException e) {
      // Don't rewrite if anything goes wrong
    }
  }


  public static void conditionalSmtpFromRewrite(Collection<String> headers, Properties sessionProps, String fromAddress)
  {
      boolean safeToRewrite = fromAddress.matches("^.*@[^ ]*nyu\\.edu[^.]*");

      if (shouldPreserveAddresses(headers) && safeToRewrite) {
          // Arrange for the SMTP from address to be the same as the sender's address
          sessionProps.put("mail.smtp.from", fromAddress);
      }
  }


  public static void conditionalFromAddressRewrite(Collection<String> headers, MimeMessage msg)
  {
    if (!shouldPreserveAddresses(headers)) {
      rewriteFromAddress(msg);
    }
  }


}
