package org.sakaiproject.importer.impl.translators;

import org.sakaiproject.importer.api.IMSResourceTranslator;
import org.sakaiproject.importer.api.Importable;
import org.sakaiproject.importer.impl.Blackboard6FileParser;
import org.sakaiproject.importer.impl.importables.Assessment;

import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMResult;
import javax.xml.transform.dom.DOMSource;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;
import org.springframework.core.io.ClassPathResource;
import org.xml.sax.SAXException;
import org.xml.sax.InputSource;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import javax.xml.parsers.ParserConfigurationException;

import org.w3c.dom.Document;
import org.w3c.dom.Node;

public class Bb6QtiTranslator implements IMSResourceTranslator {

	private static final String xsl = "org/sakaiproject/importer/xml/Bb2Qti.xsl";

	public String getTypeName() {
		return "assessment/x-bb-qti-test";
	}

	public Importable translate(Node resourceNode, Document descriptor,
			String contextPath, String archiveBasePath) {

		Assessment rv = new Assessment();
		Document stylesheet = readDocument(xsl);
		rv.setQti(transformDocument(descriptor, stylesheet));
		rv.setVersion("1.2");
		rv.setLegacyGroup(Blackboard6FileParser.ASSESSMENT_GROUP);
		return rv;
	}

	public boolean processResourceChildren() {
		return false;
	}

	public static Document transformDocument(Document document, Document stylesheet) {
		Document transformedDoc = null;
		DocumentBuilderFactory builderFactory = 
			DocumentBuilderFactory.newInstance();
		builderFactory.setNamespaceAware(true);
		try {
			DocumentBuilder documentBuilder = builderFactory.newDocumentBuilder();
			transformedDoc = documentBuilder.newDocument();
		}
		catch(ParserConfigurationException e) {
			e.printStackTrace();
		}
		DOMSource docSource = new DOMSource(document);
		DOMResult docResult = new DOMResult(transformedDoc);
		DOMSource xslSource = new DOMSource(stylesheet);
		Transformer transformer = null;
		TransformerFactory transformerFactory = TransformerFactory.newInstance();

		try {
			transformer = transformerFactory.newTransformer(xslSource);
			transformer.transform(docSource, docResult);
		}
		catch(TransformerConfigurationException e) {
			e.printStackTrace();
		}
		catch(TransformerException e) {
			e.printStackTrace();
		}
		return transformedDoc;
	}

	/**
	 * Spring Classpath version of org.sakaiproject.util.Xml's readDocument... 
	 * maybe should be in util so that folks can use it in components?
	 *
	 */
	public Document readDocument(String name)
	{
		Document doc = null;
		ClassPathResource resource = new ClassPathResource(name);

		// first try using whatever character encoding the XML itself specifies
		try {
			DocumentBuilder docBuilder = getDocumentBuilder();
			InputStream inStream = resource.getInputStream();
			doc = docBuilder.parse(inStream);
		}
		catch (Exception e) {
			doc = null;
		}

		if (doc != null) return doc;

		// OK, that didn't work - the document is probably ISO-8859-1
		try
		{
			DocumentBuilder docBuilder = getDocumentBuilder();
			InputStreamReader in = new InputStreamReader(resource.getInputStream(), "ISO-8859-1");
			InputSource inputSource = new InputSource(in);
			doc = docBuilder.parse(inputSource);
		}
		catch (Exception any)
		{
			doc = null;
		}

		if (doc != null) return doc;

		// try forcing UTF-8
		try
		{
			DocumentBuilder docBuilder = getDocumentBuilder();
			InputStreamReader in = new InputStreamReader(resource.getInputStream(), "UTF-8");
			InputSource inputSource = new InputSource(in);
			doc = docBuilder.parse(inputSource);
		}
		catch (Exception any)
		{
			any.printStackTrace();
			doc = null;
		}

		return doc;
	}

	private DocumentBuilder getDocumentBuilder() throws ParserConfigurationException
	{
		DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
		dbf.setNamespaceAware(true);

		return dbf.newDocumentBuilder();
	}


}
