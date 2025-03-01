"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("../globals");
const client_v1_read_1 = __importDefault(require("./client.v1.read"));
const types_1 = require("../types");
const fs = __importStar(require("fs"));
const media_helpers_v1_1 = require("./media-helpers.v1");
const helpers_1 = require("../helpers");
const UPLOAD_ENDPOINT = "media/upload.json";
/**
 * Base Twitter v1 client with read/write rights.
 */
class TwitterApiv1ReadWrite extends client_v1_read_1.default {
    constructor() {
        super(...arguments);
        this._prefix = globals_1.API_V1_1_PREFIX;
    }
    /**
     * Get a client with only read rights.
     */
    get readOnly() {
        return this;
    }
    /* Tweet API */
    /**
     * Post a new tweet.
     * https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/post-statuses-update
     */
    tweet(status, payload = {}) {
        const queryParams = {
            status,
            tweet_mode: "extended",
            ...payload,
        };
        return this.post("statuses/update.json", queryParams);
    }
    /**
     * Quote an existing tweet.
     * https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/post-statuses-update
     */
    async quote(status, quotingStatusId, payload = {}) {
        const url = "https://twitter.com/i/statuses/" + quotingStatusId;
        return this.tweet(status, { ...payload, attachment_url: url });
    }
    /**
     * Post a series of tweets.
     * https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/post-statuses-update
     */
    async tweetThread(tweets) {
        const postedTweets = [];
        for (const tweet of tweets) {
            // Retrieve the last sent tweet
            const lastTweet = postedTweets.length
                ? postedTweets[postedTweets.length - 1]
                : null;
            // Build the tweet query params
            const queryParams = {
                ...(typeof tweet === "string" ? { status: tweet } : tweet),
            };
            // Reply to an existing tweet if needed
            const inReplyToId = lastTweet
                ? lastTweet.id_str
                : queryParams.in_reply_to_status_id;
            const status = queryParams.status;
            if (inReplyToId) {
                postedTweets.push(await this.reply(status, inReplyToId, queryParams));
            }
            else {
                postedTweets.push(await this.tweet(status, queryParams));
            }
        }
        return postedTweets;
    }
    /**
     * Reply to an existing tweet. Shortcut to `.tweet` with tweaked parameters.
     * https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/post-statuses-update
     */
    reply(status, in_reply_to_status_id, payload = {}) {
        return this.tweet(status, {
            auto_populate_reply_metadata: true,
            in_reply_to_status_id,
            ...payload,
        });
    }
    /**
     * Delete an existing tweet belonging to you.
     * https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/post-statuses-destroy-id
     */
    deleteTweet(tweetId) {
        return this.post("statuses/destroy/:id.json", { tweet_mode: "extended" }, { params: { id: tweetId } });
    }
    /* User API */
    /**
     * Report the specified user as a spam account to Twitter.
     * Additionally, optionally performs the equivalent of POST blocks/create on behalf of the authenticated user.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/mute-block-report-users/api-reference/post-users-report_spam
     */
    reportUserAsSpam(options) {
        return this.post("users/report_spam.json", {
            tweet_mode: "extended",
            ...options,
        });
    }
    /**
     * Turn on/off Retweets and device notifications from the specified user.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/follow-search-get-users/api-reference/post-friendships-update
     */
    updateFriendship(options) {
        return this.post("friendships/update.json", options);
    }
    /**
     * Follow the specified user.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/follow-search-get-users/api-reference/post-friendships-create
     */
    createFriendship(options) {
        return this.post("friendships/create.json", options);
    }
    /**
     * Unfollow the specified user.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/follow-search-get-users/api-reference/post-friendships-destroy
     */
    destroyFriendship(options) {
        return this.post("friendships/destroy.json", options);
    }
    /* Account API */
    /**
     * Update current account settings for authenticating user.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/get-account-settings
     */
    updateAccountSettings(options) {
        return this.post("account/settings.json", options);
    }
    /**
     * Sets some values that users are able to set under the "Account" tab of their settings page.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile
     */
    updateAccountProfile(options) {
        return this.post("account/update_profile.json", options);
    }
    /**
     * Uploads a profile banner on behalf of the authenticating user.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile_banner
     */
    async updateAccountProfileBanner(file, options = {}) {
        const queryParams = {
            banner: await (0, media_helpers_v1_1.readFileIntoBuffer)(file),
            ...options,
        };
        return this.post("account/update_profile_banner.json", queryParams, {
            forceBodyMode: "form-data",
        });
    }
    /**
     * Updates the authenticating user's profile image.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile_image
     */
    async updateAccountProfileImage(file, options = {}) {
        const queryParams = {
            tweet_mode: "extended",
            image: await (0, media_helpers_v1_1.readFileIntoBuffer)(file),
            ...options,
        };
        return this.post("account/update_profile_image.json", queryParams, {
            forceBodyMode: "form-data",
        });
    }
    /**
     * Removes the uploaded profile banner for the authenticating user.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/post-account-remove_profile_banner
     */
    removeAccountProfileBanner() {
        return this.post("account/remove_profile_banner.json");
    }
    /* Lists */
    /**
     * Creates a new list for the authenticated user.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/create-manage-lists/api-reference/post-lists-create
     */
    createList(options) {
        return this.post("lists/create.json", {
            tweet_mode: "extended",
            ...options,
        });
    }
    /**
     * Updates the specified list. The authenticated user must own the list to be able to update it.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/create-manage-lists/api-reference/post-lists-update
     */
    updateList(options) {
        return this.post("lists/update.json", {
            tweet_mode: "extended",
            ...options,
        });
    }
    /**
     * Deletes the specified list. The authenticated user must own the list to be able to destroy it.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/create-manage-lists/api-reference/post-lists-destroy
     */
    removeList(options) {
        return this.post("lists/destroy.json", {
            tweet_mode: "extended",
            ...options,
        });
    }
    /**
     * Adds multiple members to a list, by specifying a comma-separated list of member ids or screen names.
     * If you add a single `user_id` or `screen_name`, it will target `lists/members/create.json`, otherwise
     * it will target `lists/members/create_all.json`.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/create-manage-lists/api-reference/post-lists-members-create_all
     */
    addListMembers(options) {
        const hasMultiple = (options.user_id && (0, helpers_1.hasMultipleItems)(options.user_id)) ||
            (options.screen_name && (0, helpers_1.hasMultipleItems)(options.screen_name));
        const endpoint = hasMultiple
            ? "lists/members/create_all.json"
            : "lists/members/create.json";
        return this.post(endpoint, options);
    }
    /**
     * Removes multiple members to a list, by specifying a comma-separated list of member ids or screen names.
     * If you add a single `user_id` or `screen_name`, it will target `lists/members/destroy.json`, otherwise
     * it will target `lists/members/destroy_all.json`.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/create-manage-lists/api-reference/post-lists-members-destroy_all
     */
    removeListMembers(options) {
        const hasMultiple = (options.user_id && (0, helpers_1.hasMultipleItems)(options.user_id)) ||
            (options.screen_name && (0, helpers_1.hasMultipleItems)(options.screen_name));
        const endpoint = hasMultiple
            ? "lists/members/destroy_all.json"
            : "lists/members/destroy.json";
        return this.post(endpoint, options);
    }
    /**
     * Subscribes the authenticated user to the specified list.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/create-manage-lists/api-reference/post-lists-subscribers-create
     */
    subscribeToList(options) {
        return this.post("lists/subscribers/create.json", {
            tweet_mode: "extended",
            ...options,
        });
    }
    /**
     * Unsubscribes the authenticated user of the specified list.
     * https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/create-manage-lists/api-reference/post-lists-subscribers-destroy
     */
    unsubscribeOfList(options) {
        return this.post("lists/subscribers/destroy.json", {
            tweet_mode: "extended",
            ...options,
        });
    }
    /* Media upload API */
    /**
     * This endpoint can be used to provide additional information about the uploaded media_id.
     * This feature is currently only supported for images and GIFs.
     * https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-metadata-create
     */
    createMediaMetadata(mediaId, metadata) {
        return this.post("media/metadata/create.json", { media_id: mediaId, ...metadata }, { prefix: globals_1.API_V1_1_UPLOAD_PREFIX, forceBodyMode: "json" });
    }
    /**
     * Use this endpoint to associate uploaded subtitles to an uploaded video. You can associate subtitles to video before or after Tweeting.
     * **To obtain subtitle media ID, you must upload each subtitle file separately using `.uploadMedia()` method.**
     *
     * https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-subtitles-create
     */
    createMediaSubtitles(mediaId, subtitles) {
        return this.post("media/subtitles/create.json", {
            media_id: mediaId,
            media_category: "TweetVideo",
            subtitle_info: { subtitles },
        }, { prefix: globals_1.API_V1_1_UPLOAD_PREFIX, forceBodyMode: "json" });
    }
    /**
     * Use this endpoint to dissociate subtitles from a video and delete the subtitles. You can dissociate subtitles from a video before or after Tweeting.
     * https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-subtitles-delete
     */
    deleteMediaSubtitles(mediaId, ...languages) {
        return this.post("media/subtitles/delete.json", {
            media_id: mediaId,
            media_category: "TweetVideo",
            subtitle_info: {
                subtitles: languages.map((lang) => ({ language_code: lang })),
            },
        }, { prefix: globals_1.API_V1_1_UPLOAD_PREFIX, forceBodyMode: "json" });
    }
    /**
     * Upload a media (JPG/PNG/GIF/MP4/WEBP) or subtitle (SRT) to Twitter and return the media_id to use in tweet/DM send.
     *
     * @param file If `string`, filename is supposed.
     * A `Buffer` is a raw file.
     * `fs.promises.FileHandle` or `number` are file pointers.
     *
     * @param options.type File type (Enum 'jpg' | 'longmp4' | 'mp4' | 'png' | 'gif' | 'srt' | 'webp').
     * If filename is given, it could be guessed with file extension, otherwise this parameter is mandatory.
     * If type is not part of the enum, it will be used as mime type.
     *
     * Type `longmp4` is **required** is you try to upload a video higher than 140 seconds.
     *
     * @param options.chunkLength Maximum chunk length sent to Twitter. Default goes to 1 MB.
     *
     * @param options.additionalOwners Other user IDs allowed to use the returned media_id. Default goes to none.
     *
     * @param options.maxConcurrentUploads Maximum uploaded chunks in the same time. Default goes to 3.
     *
     * @param options.target Target type `tweet` or `dm`. Defaults to `tweet`.
     * You must specify it if you send a media to use in DMs.
     */
    async uploadMedia(file, options = {}) {
        var _a, _b;
        const chunkLength = (_a = options.chunkLength) !== null && _a !== void 0 ? _a : 1024 * 1024;
        const { fileHandle, mediaCategory, fileSize, mimeType } = await this.getUploadMediaRequirements(file, options);
        // Get the file handle (if not buffer)
        try {
            // Finally! We can send INIT message.
            const mediaData = await this.post(UPLOAD_ENDPOINT, {
                command: "INIT",
                total_bytes: fileSize,
                media_type: mimeType,
                media_category: (_b = options.mediaCategory) !== null && _b !== void 0 ? _b : mediaCategory,
                additional_owners: options.additionalOwners,
                shared: options.shared ? true : undefined,
            }, { prefix: globals_1.API_V1_1_UPLOAD_PREFIX });
            // Upload the media chunk by chunk
            await this.mediaChunkedUpload(fileHandle, chunkLength, mediaData.media_id_string, options.maxConcurrentUploads);
            // Finalize media
            const fullMediaData = await this.post(UPLOAD_ENDPOINT, {
                command: "FINALIZE",
                media_id: mediaData.media_id_string,
            }, { prefix: globals_1.API_V1_1_UPLOAD_PREFIX });
            if (fullMediaData.processing_info &&
                fullMediaData.processing_info.state !== "succeeded") {
                // Must wait if video is still computed
                await this.awaitForMediaProcessingCompletion(fullMediaData);
            }
            // Video is ready, return media_id
            return fullMediaData.media_id_string;
        }
        finally {
            // Close file if any
            if (typeof file === "number") {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                fs.close(file, () => { });
            }
            else if (typeof fileHandle === "object" &&
                !(fileHandle instanceof Buffer)) {
                fileHandle.close();
            }
        }
    }
    async awaitForMediaProcessingCompletion(fullMediaData) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            fullMediaData = await this.mediaInfo(fullMediaData.media_id_string);
            const { processing_info } = fullMediaData;
            if (!processing_info || processing_info.state === "succeeded") {
                // Ok, completed!
                return;
            }
            if (processing_info.state === "failed") {
                if (processing_info.error) {
                    const { name, message } = processing_info.error;
                    throw new Error(`Failed to process media: ${name} - ${message}.`);
                }
                throw new Error("Failed to process the media.");
            }
            if (processing_info.check_after_secs) {
                // Await for given seconds
                await (0, media_helpers_v1_1.sleepSecs)(processing_info.check_after_secs);
            }
            else {
                // No info; Await for 5 seconds
                await (0, media_helpers_v1_1.sleepSecs)(5);
            }
        }
    }
    async getUploadMediaRequirements(file, { mimeType, type, target, longVideo } = {}) {
        // Get the file handle (if not buffer)
        let fileHandle;
        try {
            fileHandle = await (0, media_helpers_v1_1.getFileHandle)(file);
            // Get the mimetype
            const realMimeType = (0, media_helpers_v1_1.getMimeType)(file, type, mimeType);
            // Get the media category
            let mediaCategory;
            // If explicit longmp4 OR explicit MIME type and not DM target
            if (realMimeType === types_1.EUploadMimeType.Mp4 &&
                ((!mimeType && !type && target !== "dm") || longVideo)) {
                mediaCategory = "amplify_video";
            }
            else {
                mediaCategory = (0, media_helpers_v1_1.getMediaCategoryByMime)(realMimeType, target !== null && target !== void 0 ? target : "tweet");
            }
            return {
                fileHandle,
                mediaCategory,
                fileSize: await (0, media_helpers_v1_1.getFileSizeFromFileHandle)(fileHandle),
                mimeType: realMimeType,
            };
        }
        catch (e) {
            // Close file if any
            if (typeof file === "number") {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                fs.close(file, () => { });
            }
            else if (typeof fileHandle === "object" &&
                !(fileHandle instanceof Buffer)) {
                fileHandle.close();
            }
            throw e;
        }
    }
    async mediaChunkedUpload(fileHandle, chunkLength, mediaId, maxConcurrentUploads = 3) {
        // Send chunk by chunk
        let chunkIndex = 0;
        if (maxConcurrentUploads < 1) {
            throw new RangeError("Bad maxConcurrentUploads parameter.");
        }
        // Creating a buffer for doing file stuff (if we don't have one)
        const buffer = fileHandle instanceof Buffer ? undefined : Buffer.alloc(chunkLength);
        // Sliced/filled buffer returned for each part
        let readBuffer;
        // Needed to know when we should stop reading the file
        let nread;
        // Needed to use the buffer object (file handles always "remembers" file position)
        let offset = 0;
        [readBuffer, nread] = await (0, media_helpers_v1_1.readNextPartOf)(fileHandle, chunkLength, offset, buffer);
        offset += nread;
        // Handle max concurrent uploads
        const currentUploads = new Set();
        // Read buffer until file is completely read
        while (nread) {
            const mediaBufferPart = readBuffer.slice(0, nread);
            // Sent part if part has something inside
            if (mediaBufferPart.length) {
                const request = this.post(UPLOAD_ENDPOINT, {
                    command: "APPEND",
                    media_id: mediaId,
                    segment_index: chunkIndex,
                    media: mediaBufferPart,
                }, { prefix: globals_1.API_V1_1_UPLOAD_PREFIX });
                currentUploads.add(request);
                request.then(() => {
                    currentUploads.delete(request);
                });
                chunkIndex++;
            }
            if (currentUploads.size >= maxConcurrentUploads) {
                // Await for first promise to be finished
                await Promise.race(currentUploads);
            }
            [readBuffer, nread] = await (0, media_helpers_v1_1.readNextPartOf)(fileHandle, chunkLength, offset, buffer);
            offset += nread;
        }
        await Promise.all([...currentUploads]);
    }
}
exports.default = TwitterApiv1ReadWrite;
