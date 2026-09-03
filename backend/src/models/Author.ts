import { Schema, model, Document } from 'mongoose';

export interface IAuthor extends Document {
  name: string;
  email: string;
  country: string;
  profileImage: string;
  profileImagePublicId: string;
  passwordHash: string;
  bio: string;
  socials: Record<string, string>;
  createdAt: Date;
}

const schema = new Schema<IAuthor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    profileImage: {
      type: String,
      required: true,
    },

    profileImagePublicId: {
      type: String,
      required: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },

    socials: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

export const Author = model<IAuthor>('Author', schema);