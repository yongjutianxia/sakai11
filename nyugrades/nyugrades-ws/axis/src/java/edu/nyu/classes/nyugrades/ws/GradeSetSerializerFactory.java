package edu.nyu.classes.nyugrades.ws;

import java.util.ArrayList;
import java.util.Iterator;
import org.apache.axis.encoding.Serializer;
import org.apache.axis.encoding.SerializerFactory;
import org.apache.axis.Constants;

public class GradeSetSerializerFactory implements SerializerFactory
{
    public Serializer getSerializerAs(String mechanismType)
    {
        return new GradeSetSerializer();
    }

    public Iterator getSupportedMechanismTypes()
    {
        ArrayList<String> list = new ArrayList<String>();
        list.add(Constants.AXIS_SAX);

        return list.iterator();
    }
}
