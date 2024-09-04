const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    cityName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxLength: [60, 'A location name can have max 60 characters'],
      minLength: [2, 'A location name can have min 2 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxLength: [60, 'A country name can have max 60 characters'],
      minLength: [2, 'A country name can have min 2 characters'],
    },
    emoji: {
      type: String,
      required: [true, 'Emoji is required'],
      trim: true,
    },
    arrivalDate: { type: Date, required: [true, 'Arrival date is required'] },
    departureDate: {
      type: Date,
      // required: [true, 'Departure date is required'],
    },
    notes: String,
    position: {
      type: {
        lat: Number,
        lng: Number,
      },
      required: [true, 'Position is required'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Location record must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

citySchema.index([{ country: 1 }, { cityName: 1 }]);

citySchema.virtual('durationDays').get(function () {
  if (this.departureDate) {
    const diff = this.departureDate.getTime() - this.arrivalDate.getTime();
    return diff / (1000 * 60 * 60 * 24);
  }
});

const City = mongoose.model('City', citySchema);

module.exports = City;
