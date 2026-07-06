import prisma from "../configs/prisma.js";

export const getMyProfile = async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true, role: true },
        },
        attributeValues: {
          include: { attribute: true },
        },
        projects: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!profile) return res.status(404).json({ error: "Profile not found." });

    return res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
};

export const updateProfile = async (req, res) => {
  const { firstName, lastName, location, photoUrl, version } = req.body;

  try {
    if (!version) {
      return res
        .status(400)
        .json({ error: "Version number is required for auto-save locking." });
    }

    const currentProfile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
      include: { user: true },
    });

    if (!currentProfile)
      return res.status(404).json({ error: "Profile not found." });

    if (currentProfile.version !== version) {
      return res.status(409).json({
        error: "Conflict: Profile modified elsewhere. Please refresh.",
        currentVersion: currentProfile.version,
      });
    }

    const updatedData = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: req.user.userId },
        data: {
          firstName: firstName || currentProfile.user.firstName,
          lastName: lastName || currentProfile.user.lastName,
        },
      });

      return tx.profile.update({
        where: { id: currentProfile.id },
        data: {
          location: location || currentProfile.location,
          photoUrl: photoUrl !== undefined ? photoUrl : currentProfile.photoUrl,
          version: currentProfile.version + 1,
        },
      });
    });

    return res.status(200).json({ success: true, profile: updatedData });
  } catch (error) {
    console.error("Update Me Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to update basic profile info." });
  }
};

export const upsertAttributeValue = async (req, res) => {
  const {
    attributeId,
    textValue,
    numValue,
    boolValue,
    dateValue,
    dateStart,
    dateEnd,
    version,
  } = req.body;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    const existingValue = await prisma.profileAttributeValue.findUnique({
      where: {
        profileId_attributeId: { profileId: profile.id, attributeId },
      },
    });

    let savedValue;

    if (existingValue) {
      if (!version)
        return res
          .status(400)
          .json({ error: "Version is required for updates." });
      if (existingValue.version !== version) {
        return res.status(409).json({
          error: "Conflict: Attribute modified elsewhere.",
          currentVersion: existingValue.version,
        });
      }

      savedValue = await prisma.profileAttributeValue.update({
        where: { id: existingValue.id },
        data: {
          textValue,
          numValue,
          boolValue,
          dateValue: dateValue ? new Date(dateValue) : null,
          dateStart: dateStart ? new Date(dateStart) : null,
          dateEnd: dateEnd ? new Date(dateEnd) : null,
          version: existingValue.version + 1,
        },
      });
    } else {
      savedValue = await prisma.profileAttributeValue.create({
        data: {
          profileId: profile.id,
          attributeId,
          textValue,
          numValue,
          boolValue,
          dateValue: dateValue ? new Date(dateValue) : null,
          dateStart: dateStart ? new Date(dateStart) : null,
          dateEnd: dateEnd ? new Date(dateEnd) : null,
        },
      });
    }

    return res.status(200).json({ success: true, attributeValue: savedValue });
  } catch (error) {
    console.error("Upsert Attribute Value Error:", error);
    return res.status(500).json({ error: "Failed to save attribute value." });
  }
};

export const deleteAttributeValue = async (req, res) => {
  const { attributeId } = req.params;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    await prisma.profileAttributeValue.delete({
      where: {
        profileId_attributeId: { profileId: profile.id, attributeId },
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Attribute removed from profile." });
  } catch (error) {
    console.error("Delete Attribute Value Error:", error);
    return res
      .status(500)
      .json({ error: "Failed to remove attribute. It may not exist." });
  }
};
