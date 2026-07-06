import prisma from "../configs/prisma.js";

export const createPost = async (req, res) => {
  const { positionId } = req.params;
  const { content } = req.body;

  try {
    if (!content)
      return res.status(400).json({ error: "Post content is required." });

    const newPost = await prisma.discussion.create({
      data: {
        positionId,
        authorId: req.user.userId,
        content,
      },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    return res.status(500).json({ error: "Failed to post message." });
  }
};

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
