import prisma from "../configs/prisma";

// create attribute
export const createAttribute = async (req, res) => {
  const { name, category, type, options } = req.body;
  try {
    if (!name || !category || !type) {
      return res
        .status(400)
        .json({ error: "Name, category, and type are required." });
    }

    if (
      type === "DROPDOWN" &&
      (!Array.isArray(options) || options.length === 0)
    ) {
      return res
        .status(400)
        .json({ error: "Dropdown attributes require an array of options." });
    }

    const existingAttr = await prisma.attribute.findUnique({ where: { name } });

    if (existingAttr) {
      return res
        .status(400)
        .json({ error: "An attribute with this name already exists." });
    }

    const newAttribute = await prisma.attribute.create({
      data: {
        name,
        category,
        type,
        options: type === "DROPDOWN" ? options : [],
      },
    });

    return res.status(201).json({ success: true, attribute: newAttribute });
  } catch (error) {
    console.error("Create Attribute Error:", error);
    return res.status(500).json({ error: "Failed to create attribute." });
  }
};

// get all attribute
export const getAllAttributes = async (req, res) => {
  const { category, search } = req.query;

  try {
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { contains: search, mode: "insensitive" };

    const attributes = await prisma.attribute.findMany({
      where: filter,
      orderBy: { name: "asc" },
    });

    return res.status(200).json({ success: true, attributes });
  } catch (error) {
    console.error("Fetch Attributes Error:", error);
    return res.status(500).json({ error: "Failed to fetch attributes." });
  }
};

// update attribute
export const updateAttribute = async (req, res) => {
  const { id } = req.params;
  const { name, category, type, options, version } = req.body;

  try {
    if (!version) {
      return res
        .status(400)
        .json({ error: "Version number is required for optimistic locking." });
    }

    const currentAttribute = await prisma.attribute.findUnique({
      where: { id },
    });

    if (!currentAttribute) {
      return res.status(404).json({ error: "Attribute not found." });
    }

    if (currentAttribute.version !== version) {
      return res.status(409).json({
        error:
          "Conflict! The attribute was modified by another user. Please refresh and try again.",
        currentVersion: currentAttribute.version,
      });
    }

    const finalOptions =
      type === "DROPDOWN" ? options || currentAttribute.options : [];

    if (
      type === "DROPDOWN" &&
      (!Array.isArray(finalOptions) || finalOptions.length === 0)
    ) {
      return res
        .status(400)
        .json({ error: "Dropdown attributes require an array of options." });
    }

    const updatedAttribute = await prisma.attribute.update({
      where: { id },
      data: {
        name: name || currentAttribute.name,
        category: category || currentAttribute.category,
        type: type || currentAttribute.type,
        options: finalOptions,
        version: currentAttribute.version + 1,
      },
    });

    return res.status(200).json({ success: true, attribute: updatedAttribute });
  } catch (error) {
    // prisma unique constraint error code P2002
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "An attribute with this new name already exists." });
    }
    console.error("Update Attribute Error:", error);
    return res.status(500).json({ error: "Failed to update attribute." });
  }
};

// delete attribute
export const deleteAttribute = async (req, res) => {
  const { id } = req.params;
  try {
    const attribute = await prisma.attribute.findUnique({ where: { id } });
    
    if (!attribute) {
      return res.status(404).json({ error: "Attribute not found." });
    }

    await prisma.attribute.delete({ where: { id } });

    return res
      .status(200)
      .json({ success: true, message: "Attribute deleted successfully." });
  } catch (error) {
    console.error("Delete Attribute Error:", error);
    return res.status(500).json({ error: "Failed to delete attribute." });
  }
};
