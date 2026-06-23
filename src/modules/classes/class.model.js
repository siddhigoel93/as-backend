const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    section: {
      type: String,
      required: true,
      trim: true
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    students: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      ],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Add a unique compound index on name + section with case-insensitive collation
classSchema.index(
  { name: 1, section: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 }
  }
);

module.exports = mongoose.model("Class", classSchema);
