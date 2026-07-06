import prisma from "../configs/prisma.js";

export const getDiscussions = async (req, res) => {
  const { positionId } = req.params;

  try {
    const posts = await prisma.discussion.findMany({
      where: { positionId },
      include: {
        author: {
          select: { email: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load discussions." });
  }
};
