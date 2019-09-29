const FreshObject = require('./FreshObject')
const axios = require('axios')

/**
 * iFunny chat class, representing a private, public, or direct messaging chat
 * @extends {FreshObject}
 * @param {String|Number} channel_url       sendbird channel_url of this channel
 * @param {Object} opts                     optional parameters
 * @param {Client} opts.client=Client       Client that this object belongs to
 * @param {Number} opts.paginated_size=25   size of each paginated request
 * @param {Object} opts.data={}             data of this object, that can be used before fetching new info
 */
class Chat extends FreshObject {
    constructor(channel_url, opts = {}) {
        super(channel_url, opts)
        this.channel_url = this.id
        this.url = `${this.sendbird_api}/group_channels/${this.channel_url}`
    }

    /**
     * Get some value from this objects own internal JSON state
     * @param  {String}  key      key to query
     * @param  {*}  fallback=null fallback value, if no value is found for key
     * @return {Promise<*>}       retrieved data
     */
    async get(key, fallback = null) {
        let found = this._object_payload[key]

        if (found != undefined && !this._update) {
            this._update = false
            return found
        }

        this._update = false
        let response = await axios({
            method: 'get',
            url: this.url,
            headers: await this.sendbird_headers
        })

        this._object_payload = response.data
        return this._object_payload[key] || fallback
    }

    /**
     * Send a text message to this chat
     * @param  {String}  content Message content
     * @return {Promise<Chat>}   This chat instance
     */
    async send_text_message(content) {
        await this.client.send_text_message(content, this)
        return this
    }

    /**
     * Send an image message to this chat
     * @param {String}  url             Url pointing to this image
     * @param {Object}  [opts={}]       Optional parameters
     * @param {Number} opts.height=780  Height of this image
     * @param {Number} opts.width=780   Width of this image
     * @param {String} opts.file_name   File name to send this file as
     * @param {String} opts.file_type   MIME type of this file
     * @return {Promise<Chat>}          This chat instance
     */
    async send_image_message(url, opts = {}) {
        await this.client.send_image_message(url, this, opts)
        return this
    }

    /**
     * Mark this chat as read
     * @return {Promise<Chat>} This chat instance
     */
    async read() {
        await this.client.mark_chat_read(this)
        return this.fresh
    }

    /**
     * Add an operator to this chat
     * @param  {User}  user                 User who should be made an operator
     * @return {Promise<Array<ChatUser>>}   Operators of this chat, including the newly added
     */
    async add_operator(user) {
        await this.client.modify_chat_operator('put', user, this)
        return await this.fresh.operators
    }

    /**
     * Remove an operator from this chat
     * @param  {User}  user                 User who should no longer be an operator
     * @return {Promise<Array<ChatUser>>}   Remaining operators of this chat
     */
    async remove_operator(user) {
        await this.client.modify_chat_operator('delete', user, this)
        return await this.fresh.operators
    }

    /**
     * Join this chat
     * @return {Promise<Chat>} This chat instance
     */
    async join() {
        await this.client.modify_chat_presence('put', this)
        return this.fresh
    }

    /**
     * Leave this chat
     * @return {Promise<Chat>} This chat instance
     */
    async exit() {
        await this.client.modify_chat_presence('delete', this)
        return this.fresh
    }

    /**
     * Kick a user from this chat
     * @param  {User}  user         User that should be kicked from this chat
     * @return {Promise<ChatUser>}  User that was kicked from this chat
     */
    async kick(user) {
        await this.client.kick_chat_user(user, this)
        return user.fresh
    }

    /**
     * Invite a single or multiple users to this chat
     * @param  {User|Array<User>}  user     Users to invite to this chat
     * @return {Promise<Array<ChatUser>>}   Array of users invited
     */
    async invite(user) {
        let ChatUser = require('./ChatUser')
        await this.client.invite_users_to_chat(user, this)
        if (await user.id) {
            return [new ChatUser(user.id, this, { client: this.client, data: user._object_payload })];
        } else {
            return user.map(
                it => new ChatUser(it.id, this, { client: this.client, data: user._object_payload })
            )
        }
    }

    /**
     * Timestamp of when chats client was invited in seconds
     * @type {Number}
     */
    get invited_at() {
        return this.get('invited_at')
    }

    /**
     * This groups type
     * Public groups are `opengroup`
     * Private groups are `group`
     * Direct messages are `chat`
     * @type {String}
     */
    get type() {
        return this.get('custom_type')
    }

    /**
     * Is this a public group?
     * @type {Boolean}
     */
    get is_public() {
        return (async () => {
            return (await this.type == 'opengroup')
        })()
    }

    /**
     * Is this group private?
     * @type {Boolean}
     */
    get is_private() {
        return (async () => {
            return (await this.type == 'group')
        })()
    }

    /**
     * Is this a direct message?
     * @type {Boolean}
     */
    get is_direct() {
        return (async () => {
            return (await this.type == 'chat')
        })()
    }

    /**
     * This clients state in this group
     * Users who have joined are joined
     * Users who have a pending invite are invited
     * @type {String}
     */
    get state() {
        return this.get('member_state')
    }

    /**
     * Is this group frozen?
     * @type {Boolean}
     */
    get is_frozen() {
        return (async () => {
            return (await this.meta).frozen
        })()
    }

    /**
     * Is this group hidden?
     * @type {Boolean}
     */
    get is_hidden() {
        return this.get('is_hidden')
    }

    /**
     * Are push notifications enabled for this client?
     * @type {Boolean}
     */
    get is_push_enabled() {
        return this.get('is_push_enabled')
    }

    /**
     * Number of members who have been invited
     * but have not necessarily joined
     * @type {Number}
     */
    get member_count() {
        return this.get('member_count')
    }

    /**
     * Number of members who have joined
     * @type {Number}
     */
    get joined_member_count() {
        return this.get('joined_member_count')
    }

    /**
     * Is this group discoverable?
     * @type {Boolean}
     */
    get is_discoverable() {
        return this.get('is_discoverable')
    }

    /**
     * Unread message count
     * @type {Number}
     */
    get unread_count() {
        return this.get('unread_message_count')
    }

    /**
     * This groups cover images
     * @type {Image}
     */
    get cover() {
        return (async () => {
            let Image = require('./Image')
            return new Image(await this.get('cover_url'), { client: this.client })
        })()
    }

    /**
     * This groups metadata
     * @type {Object}
     */
    get meta() {
        return (async () => {
            return JSON.parse(await this.get('data')).chatInfo || {}
        })()
    }

    get operators() {
        return (async () => {
            let ChatUser = require('./ChatUser')
            return ((await this.meta).operatorsIdList || []).map(
                id => new ChatUser(id, this, { client: this.client })
            )
        })()
    }

    /**
     * Permalink to this chat
     * @type {String}
     */
    get link() {
        return (async () => {
            return (await this.meta).permalink
        })()
    }

    /**
     * Channel name
     * @type {String}
     */
    get name() {
        return this.get('name')
    }

    /**
     * Alias to `this.name`
     * @type {String}
     */
    get title() {
        return this.name
    }

    /**
     * Timestamp of chat creation in seconds
     * @type {Number}
     */
    get created_at() {
        return this.get('created_at')
    }

}

module.exports = Chat
