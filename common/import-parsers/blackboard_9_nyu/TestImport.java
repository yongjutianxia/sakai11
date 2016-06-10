import java.io.*;
import org.sakaiproject.importer.impl.Blackboard9NYUFileParser;
import org.sakaiproject.importer.api.ImportDataSource;
import org.apache.commons.lang.builder.ReflectionToStringBuilder;

public class TestImport
{
    public static void main(String[] args) {
        try {
            // BB9_ArchiveFile_NYUClasses_3_20140108014606.zip
            String testArchive = "/home/mst/projects/nyu/tmp/ArchiveFile_Spring1142.EXPOS-UA1.2742_20140613021737.zip";

            FileInputStream zip = new FileInputStream(testArchive);
            long size = new File(testArchive).length();

            byte[] zipData = new byte[(int)size];
            zip.read(zipData);

            Blackboard9NYUFileParser parser = new Blackboard9NYUFileParser();

            ImportDataSource ids = parser.parse(zipData, "/tmp/moo");

            System.err.println("Categories:");
            System.err.println(ids.getItemCategories());
            System.err.println("======================================================================");

            for (Object item : ids.getItemsForCategories(ids.getItemCategories())) {
                System.err.println("======================================================================");
                String s = ReflectionToStringBuilder.toString(item);
                System.err.println(s.substring(0, Math.min(s.length(), 512)));
                System.err.println("======================================================================");
            }


        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

}
