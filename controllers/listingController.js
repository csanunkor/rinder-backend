const Listing = require('../models/Listing.js');

/**
 * Create Listing GET request
 * Used to just render the starting page for listings
 * @param {*} req 
 * @param {*} res 
 */
module.exports.createListing_get = (req, res) => {
    res.render('createListing');
}

/**
 * Create Listing POST request
 * Used to actually create a listing based on user input data
 * @param {} req 
 * @param {*} res 
 */
module.exports.createListing_post = async (req, res) => {
    const { Amenities, city, state, street,
        zipCode, location, numberOfBeds, squareFt,
        price, status, images, isSmokeFriendly, isInviteFriendly, isPetFriendly } = req.body;
    
    try {
        const listing = await Listing.create({
            Amenities, city, state, street,
            zipCode, location, numberOfBeds, squareFt,
            price, status, images, isSmokeFriendly, isInviteFriendly, isPetFriendly
        });
        res.status(200).json({ listing: listing.toJSON() });
    }
    catch (err) {
        res.status(400);
    }

}

/**
 * Delete Listing POST request
 * Used to delete a listing selected by the user
 * @param {} req 
 * @param {*} res 
 */
module.exports.deleteListing = async (req, res) => {
    try {
        const { _id } = req.body;
        const deletedListing = await Listing.findByIdAndDelete(_id, useFindAndModify=false);
        res.status(200).json({ State: "Removed", deletedListing: deletedListing.toJSON() });
    }
    catch (err) {
        res.status(400).json({ State: 'Failed to Remove' });
    }
}

/**
 * Modify Listing POST request
 * Used to modify the listing selected by the user
 * @param {*} req 
 * @param {*} res 
 */
module.exports.modifyListing = async (req, res) => {
    try {
        const { _id, updateValues } = req.body;
        const modifiedListing = await Listing.findByIdAndUpdate(_id, updateValues, useFindAndModify=false);
        res.status(200).json({ State: "Modified", modifiedListing: modifiedListing.toJSON() });
    }
    catch (err) {
        res.status(400).json({ State: 'Failed to Modify' });
    }
}