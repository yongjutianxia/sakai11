package edu.nyu.classes.nyugrades.ws;

import java.io.IOException;

import org.apache.axis.Constants;
import org.apache.axis.encoding.Serializer;
import org.apache.axis.encoding.SerializationContext;
import org.apache.axis.wsdl.fromJava.Types;

import javax.xml.namespace.QName;
import org.xml.sax.Attributes;
import org.w3c.dom.Element;

import edu.nyu.classes.nyugrades.api.Grade;
import edu.nyu.classes.nyugrades.api.GradeSet;


public class GradeSetSerializer implements Serializer
{
    public void serialize(QName name, Attributes attributes,
                          Object value, SerializationContext context)
        throws IOException
    {
        context.startElement(name, attributes);

        context.startElement(new QName("", "grades"), null);

        for (Object obj : (GradeSet) value) {
            context.startElement(new QName("", "grade"), null);
            Grade grade = (Grade) obj;
            context.serialize(new QName("", "netid"), null, grade.netId);
            context.serialize(new QName("", "emplid"), null, grade.emplId);
            context.serialize(new QName("", "gradeletter"), null, grade.gradeletter);
            context.endElement();
        }

        context.endElement();
        context.endElement();
    }


    public String getMechanismType()
    {
        return Constants.AXIS_SAX;
    }


    public Element writeSchema(Class javaType, Types types)
    {
        Element grades = types.createElement("element");
        grades.setAttribute("name", "grades");

        Element sequence = types.createElement("sequence");

        Element grade = types.createElement("element");
        grade.setAttribute("name", "grade");

	Element gradeType = types.createElement("complexType");

        for (String attribute : new String [] { "netid", "emplid", "gradeletter" }) {
            Element elt = types.createElement("element");
            elt.setAttribute("name", attribute);
            elt.setAttribute("type", "xsd:string");

            gradeType.appendChild(elt);
        }

        grade.appendChild(gradeType);
        sequence.appendChild(grade);
        grades.appendChild(sequence);

	return grades;
    }
}
