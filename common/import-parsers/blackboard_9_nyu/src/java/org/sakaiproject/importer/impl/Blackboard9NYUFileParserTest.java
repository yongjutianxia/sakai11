package org.sakaiproject.importer.impl;

import java.io.IOException;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;

import org.sakaiproject.archive.api.ImportMetadata;
import org.sakaiproject.importer.api.ImportDataSource;
import org.sakaiproject.importer.api.ImportFileParser;
import org.sakaiproject.importer.api.Importable;
import org.sakaiproject.importer.impl.importables.FileResource;
import org.sakaiproject.importer.impl.importables.Folder;

import junit.framework.TestCase;

public class Blackboard9NYUFileParserTest extends TestCase {
	private static ImportFileParser parser;
	private byte[] archiveData;
	private InputStream archiveStream;
	
	private byte[] invalidArchiveData;
	private InputStream invalidArchiveStream;
	
	public void setUp() throws IOException {
		System.out.println("doing setUp()");
		parser = new Blackboard9NYUFileParser();
		archiveStream = ClassLoader.getSystemResourceAsStream("valid-bb6-export.zip");
		archiveData = new byte[archiveStream.available()];
		archiveStream.read(archiveData,0,archiveStream.available());
		archiveStream.close();
	}
	
	public void testCanGetDataSource() {
		ImportDataSource dataSource = (ImportDataSource) parser.parse(new ByteArrayInputStream(archiveData), System.getProperty("java.io.tmpdir"));
		assertNotNull(dataSource);
		List<ImportMetadata> categories = dataSource.getItemCategories();
		List<ImportMetadata> selection = new ArrayList();
		selection.add(categories.get(2));
		Collection<Importable> dataItems = dataSource.getItemsForCategories(selection);
		System.out.println("I've got " + categories.size() + " categories in this archive.");
		System.out.println("I've got " + dataItems.size() + " data items to feed to Sakai.");
		for(Importable thing : dataItems) {
			if (thing instanceof FileResource) {
				// System.out.println(((FileResource)thing).getDestinationResourcePath() + ((FileResource)thing).getTitle() + ":" + ((FileResource)thing).getFileBytes().length + " bytes");
			}
			if (thing instanceof Folder) {
				System.out.println(((Folder)thing).getPath() + ((Folder)thing).getTitle());
			}
		}	
	}
	
	public void testArchiveIsValid() {
		assertTrue(parser.isValidArchive(new ByteArrayInputStream(archiveData)));
	}
	
	public void testBb5FormatIsInvalid() throws IOException {
		invalidArchiveStream = ClassLoader.getSystemResourceAsStream("bb5-export.zip");
		invalidArchiveData = new byte[invalidArchiveStream.available()];
		invalidArchiveStream.read(invalidArchiveData, 0, invalidArchiveStream.available());
		invalidArchiveStream.close();
		assertFalse(parser.isValidArchive(new ByteArrayInputStream(invalidArchiveData)));
	}

}

