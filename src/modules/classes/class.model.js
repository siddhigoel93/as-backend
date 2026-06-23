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
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);


classSchema.index(
  { name: 1, section: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 }
  }
);

module.exports = mongoose.model("Class", classSchema);
