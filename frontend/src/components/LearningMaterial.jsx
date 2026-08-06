export default function LearningMaterial({

    material

}) {

    if (!material)

        return <p>No material available.</p>;

    return (

        <pre className="learning-material">

            {typeof material === "object"

                ? JSON.stringify(
                      material,
                      null,
                      2
                  )

                : material}

        </pre>

    );

}