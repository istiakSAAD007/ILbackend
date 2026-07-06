import prisma from "../configs/prisma.js";

const evaluateRequirement = (requirement, profileValue) => {
  if (!profileValue) return false;

  let actual =
    profileValue.numValue !== null
      ? profileValue.numValue
      : profileValue.textValue !== null
        ? profileValue.textValue
        : profileValue.boolValue !== null
          ? profileValue.boolValue
          : null;

  if (actual === null) return false;

  let target = requirement.value;

  if (typeof actual === "number") target = parseFloat(target);
  if (typeof actual === "boolean") target = target === "true";

  switch (requirement.operator) {
    case "EQ":
      return actual === target;
    case "GT":
      return actual > target;
    case "GTE":
      return actual >= target;
    case "LT":
      return actual < target;
    case "LTE":
      return actual <= target;
    case "CONTAINS":
      return String(actual)
        .toLowerCase()
        .includes(String(target).toLowerCase());
    default:
      return false;
  }
};

export const createCV = async (req, res) => {
  const { positionId } = req.params;
  
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
      include: { attributeValues: true },
    });

    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: { requirements: true },
    });

    if (!position)
      return res.status(404).json({ error: "Position not found." });

    for (const req of position.requirements) {
      const candidateValue = profile.attributeValues.find(
        (attr) => attr.attributeId === req.attributeId,
      );

      const isPassed = evaluateRequirement(req, candidateValue);
      if (!isPassed) {
        return res.status(403).json({
          error:
            "Access Denied: Your profile does not meet the requirements for this position.",
        });
      }
    }

    const newCV = await prisma.cV.create({
      data: {
        profileId: profile.id,
        positionId: position.id,
      },
    });

    return res.status(201).json({
      success: true,
      cv: newCV,
      message: "CV Generated Successfully!",
    });
  } catch (error) {
    // handle Prisma unique constraint error = Candidate already generated CV for this position
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "You have already generated a CV for this position." });
    }
    console.error("Create CV Error:", error);
    return res.status(500).json({ error: "Failed to generate CV." });
  }
};

export const getMyCVs = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    const cvs = await prisma.cV.findMany({
      where: { profileId: profile.id },
      include: {
        position: { select: { title: true, description: true } },
        likes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, cvs });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch your CVs." });
  }
};

export const getPositionCVs = async (req, res) => {
  const { positionId } = req.params;

  try {
    const cvs = await prisma.cV.findMany({
      where: { positionId },
      include: {
        profile: {
          include: {
            user: { select: { email: true } },
            attributeValues: true,
            projects: true,
          },
        },
        likes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, cvs });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch candidate CVs." });
  }
};

export const toggleLike = async (req, res) => {
  const { cvId } = req.params;
  const recruiterId = req.user.userId;

  try {
    const existingLike = await prisma.like.findUnique({
      where: { cvId_recruiterId: { cvId, recruiterId } },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return res
        .status(200)
        .json({ success: true, message: "Like removed.", isLiked: false });
    } else {
      // Add like
      await prisma.like.create({ data: { cvId, recruiterId } });
      return res
        .status(201)
        .json({ success: true, message: "CV Liked!", isLiked: true });
    }
  } catch (error) {
    return res.status(500).json({ error: "Failed to toggle like." });
  }
};

export const deleteCV = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.cV.delete({ where: { id } });
    return res.status(200).json({ success: true, message: "CV deleted." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete CV." });
  }
};
