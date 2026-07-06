import prisma from "../configs/prisma.js";

// create position
export const createPosition = async (req, res) => {
  const { title, description, maxProjects, projectTags, requirements } =
    req.body;

  try {
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required." });
    }

    // nested writes to create position and requirements simultaneously
    const newPosition = await prisma.position.create({
      data: {
        title,
        description,
        maxProjects: maxProjects || 3,
        projectTags: projectTags || [],
        requirements: {
          create: requirements
            ? requirements.map((req) => ({
                attributeId: req.attributeId,
                operator: req.operator,
                value: req.value,
              }))
            : [],
        },
      },
      include: { requirements: true },
    });

    return res.status(201).json({ success: true, position: newPosition });
  } catch (error) {
    console.error("Create Position Error:", error);
    return res.status(500).json({ error: "Failed to create position." });
  }
};

// get all position
export const getAllPositions = async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: {
        requirements: {
          include: {
            attribute: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, positions });
  } catch (error) {
    console.error("Fetch Positions Error:", error);
    return res.status(500).json({ error: "Failed to fetch positions." });
  }
};

// update position
export const updatePosition = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    maxProjects,
    projectTags,
    requirements,
    version,
  } = req.body;

  try {
    if (!version) {
      return res
        .status(400)
        .json({ error: "Version number is required for optimistic locking." });
    }

    const currentPosition = await prisma.position.findUnique({ where: { id } });
    if (!currentPosition) {
      return res.status(404).json({ error: "Position not found." });
    }

    if (currentPosition.version !== version) {
      return res.status(409).json({
        error:
          "Conflict: This position was modified by another user. Please refresh.",
        currentVersion: currentPosition.version,
      });
    }

    const updatedPosition = await prisma.$transaction(async (tx) => {
      await tx.positionRequirement.deleteMany({ where: { positionId: id } });

      return tx.position.update({
        where: { id },
        data: {
          title: title || currentPosition.title,
          description: description || currentPosition.description,
          maxProjects:
            maxProjects !== undefined
              ? maxProjects
              : currentPosition.maxProjects,
          projectTags: projectTags || currentPosition.projectTags,
          version: currentPosition.version + 1,
          requirements: {
            create: requirements
              ? requirements.map((req) => ({
                  attributeId: req.attributeId,
                  operator: req.operator,
                  value: req.value,
                }))
              : [],
          },
        },
        include: { requirements: true },
      });
    });

    return res.status(200).json({ success: true, position: updatedPosition });
  } catch (error) {
    console.error("Update Position Error:", error);
    return res.status(500).json({ error: "Failed to update position." });
  }
};

export const deletePosition = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.position.delete({ where: { id } });

    return res
      .status(200)
      .json({ success: true, message: "Position deleted successfully." });
  } catch (error) {
    console.error("Delete Position Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to delete position. It might not exist." });
  }
};

// duplicate a position
export const duplicatePosition = async (req, res) => {
  const { id } = req.params;

  try {
    const existingPosition = await prisma.position.findUnique({
      where: { id },
      include: { requirements: true },
    });

    if (!existingPosition) {
      return res.status(404).json({ error: "Position not found." });
    }

    const clonedPosition = await prisma.position.create({
      data: {
        title: `${existingPosition.title} (Copy)`,
        description: existingPosition.description,
        maxProjects: existingPosition.maxProjects,
        projectTags: existingPosition.projectTags,
        requirements: {
          create: existingPosition.requirements.map((req) => ({
            attributeId: req.attributeId,
            operator: req.operator,
            value: req.value,
          })),
        },
      },
      include: { requirements: true },
    });

    return res.status(201).json({ success: true, position: clonedPosition });
  } catch (error) {
    console.error("Duplicate Position Error:", error);
    return res.status(500).json({ error: "Failed to duplicate position." });
  }
};
