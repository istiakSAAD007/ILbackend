import prisma from "../configs/prisma.js";

export const createProject = async (req, res) => {
  const { name, startDate, endDate, description, tags } = req.body;

  try {
    if (!name || !startDate || !description) {
      return res
        .status(400)
        .json({ error: "Name, start date, and description are required." });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    const newProject = await prisma.project.create({
      data: {
        profileId: profile.id,
        name,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        description,
        tags: tags || [],
      },
    });

    return res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    console.error("Create Project Error:", error);
    return res.status(500).json({ error: "Failed to create project." });
  }
};

export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, description, tags } = req.body;

  try {
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        description,
        tags,
      },
    });

    return res.status(200).json({ success: true, project: updatedProject });
  } catch (error) {
    console.error("Update Project Error:", error);
    return res.status(500).json({ error: "Failed to update project." });
  }
};

export const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.project.delete({ where: { id } });
    return res.status(200).json({ success: true, message: "Project deleted." });
  } catch (error) {
    console.error("Delete Project Error:", error);
    return res.status(500).json({ error: "Failed to delete project." });
  }
};
