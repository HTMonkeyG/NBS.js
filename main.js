function readLengthedStringUtf8(buffer, cursor) {
  var l = buffer.getInt32(cursor, 1);
  return {
    value: new TextDecoder().decode((new Uint8Array(buffer.buffer)).slice(cursor + 4, cursor + 4 + l)),
    length: l + 4
  }
}

class NBSHeader {
  /**
   * @param {DataView} buffer 
   * @param {Number} cursor
   * @returns 
   */
  static deserialize(buffer, cursor) {
    var result = new NBSHeader()
      , p = cursor
      , s;

    result.songLengthOld = buffer.getInt16(p, 1), p += 2;
    result.version = buffer.getInt8(p), p++;
    result.instumentCtr = buffer.getInt8(p), p++;
    result.songLength = buffer.getInt16(p, 1), p += 2;
    result.layerCtr = buffer.getInt16(p, 1), p += 2;
    s = readLengthedStringUtf8(buffer, p);
    result.songName = s.value, p += s.length;
    s = readLengthedStringUtf8(buffer, p);
    result.author = s.value, p += s.length;
    s = readLengthedStringUtf8(buffer, p);
    result.orignalAuthor = s.value, p += s.length;
    s = readLengthedStringUtf8(buffer, p);
    result.description = s.value, p += s.length;
    result.tempo = buffer.getInt16(p, 1), p += 2;
    result.autoSave = buffer.getInt8(p), p++;
    result.autoSaveDuration = buffer.getInt8(p), p++;
    result.timeSign = buffer.getInt8(p), p++;
    result.minutes = buffer.getInt32(p, 1), p += 4;
    result.leftClick = buffer.getInt32(p, 1), p += 4;
    result.rightClick = buffer.getInt32(p, 1), p += 4;
    result.noteAdded = buffer.getInt32(p, 1), p += 4;
    result.noteRemoved = buffer.getInt32(p, 1), p += 4;
    s = readLengthedStringUtf8(buffer, p);
    result.midiFile = s.value, p += s.length;
    result.loop = buffer.getInt8(p), p++;
    result.maxLoop = buffer.getInt8(p), p++;
    result.loopStartTick = buffer.getInt16(p, 1), p += 2;

    return {
      value: result,
      length: p - cursor
    }
  }

  constructor() {
    // String properties
    this.songName = "";
    this.author = "";
    this.orignalAuthor = "";
    this.description = "";
    this.midiFile = "";

    // Int32 properties
    this.minutes = 0;
    this.leftClick = 0;
    this.rightClick = 0;
    this.noteAdded = 0;
    this.noteRemoved = 0;

    // Int16 properties
    this.songLengthOld = 0;
    this.songLength = 0;
    this.layerCtr = 0;
    this.tempo = 0;
    this.loopStartTick = 0;

    // Int8 properties
    this.version = 5;
    this.instumentCtr = 0;
    this.autoSave = 0;
    this.autoSaveDuration = 0;
    this.timeSign = 0;
    this.loop = 0;
    this.maxLoop = 0;
  }

  serialize() {

  }
}

class NBS {
  static deserialize(buffer) {
    var result = new NBS()
      , dtv = new DataView(buffer)
      , p = 0
      , tickJmp = 0
      , tick = -1
      , s;

    // Read header
    s = NBSHeader.deserialize(dtv, 0);
    result.header = s.value;
    p += s.length;

    // Read notes
    while (1) {
      tickJmp = dtv.getInt16(p, 1), p += 2;
      if (!tickJmp)
        break;
      tick += tickJmp;
      s = NBSEffectiveTick.deserialize(dtv, p);
      s.value.tick = tick;
      result.effectiveTicks.push(s.value);
      p += s.length;
    }

    // Read layer properties
    for (var i = 0; i < result.header.layerCtr; i++) {
      s = NBSLayer.deserialize(dtv, p);
      p += s.length;
      result.layers.push(s.value);
    }

    // Read custom instruments
    var ci = dtv.getUint8(p++);
    for (var i = 0; i < ci; i++) {
      s = NBSCustomInstrument.deserialize(dtv, p);
      p += s.length;
      result.customInstuments.push(s.value);
    }

    return result
  }

  static createPlayer(nbs) {
    return new NBSPlayerIterator(nbs)
  }

  constructor() {
    this.header = new NBSHeader();
    this.effectiveTicks = [];
    this.layers = [];
    this.customInstuments = [];
  }

  serialize() {

  }
}

class NBSLayer {
  static deserialize(buffer, cursor) {
    var p = cursor
      , result = new NBSLayer()
      , s;

    s = readLengthedStringUtf8(buffer, p);
    result.name = s.value;
    p += s.length;
    result.lock = buffer.getInt8(p++);
    result.volume = buffer.getInt8(p++);
    result.stereo = buffer.getUint8(p++);

    return {
      value: result,
      length: p - cursor
    }
  }

  constructor() {
    /**
     * The name of the layer.
     */
    this.name = "";
    /**
     * Whether or not this layer has been marked as locked.
     * 1 = locked.
     */
    this.lock = 0;
    /** 
     * The volume of the layer (percentage).
     * Ranges from 0-100.
     */
    this.volume = 100;
    /** 
     * How much this layer is panned to the left/right.
     * 0 is 2 blocks right, 100 is center, 200 is 2 blocks left.
     */
    this.stereo = 100;
  }

  serialize() {

  }
}

class NBSCustomInstrument {
  static deserialize(buffer, cursor) {
    var p = cursor
      , result = new NBSCustomInstrument()
      , s;

    s = readLengthedStringUtf8(buffer, p);
    result.name = s.value;
    p += s.length;
    s = readLengthedStringUtf8(buffer, p);
    result.path = s.value;
    p += s.length;
    result.key = buffer.getInt8(p++);
    result.pressPianoKey = buffer.getUint8(p++);

    return {
      value: result,
      length: p = cursor
    }
  }

  constructor() {
    /**
     * The name of the instrument.
     */
    this.name = "";
    /**
     * The sound file of the instrument (relative path from the /Sounds directory).
     */
    this.path = "";
    /**
     * The key of the sound file.
     * Just like the note blocks, this ranges from 0-87.
     * Default is 45 (F#4).
     */
    this.key = 45;
    /**
     * Whether the piano should automatically press keys with this instrument when the marker passes them (0 or 1).
     */
    this.pressPianoKey = 0;
  }

  serialize() {

  }
}

class NBSEffectiveTick {
  static deserialize(buffer, cursor) {
    var p = cursor
      , layerJmp = 0
      , layer = -1
      , result = new NBSEffectiveTick()
      , s;

    while (1) {
      layerJmp = buffer.getInt16(p, 1), p += 2;
      if (!layerJmp)
        break;
      layer += layerJmp;
      s = NBSNote.deserialize(buffer, p);
      s.layer = layer;
      result.notes.push(s);
      p += 6;
    }

    return {
      value: result,
      length: p - cursor
    }
  }

  constructor() {
    this.tick = 0;
    this.notes = [];
  }

  serialize() {

  }
}

class NBSNote {
  /**
   * Read a single noteblock.
   * @param {DataView} buffer 
   * @param {Number} cursor 
   */
  static deserialize(buffer, cursor) {
    var p = cursor
      , result = new NBSNote();

    result.instrument = buffer.getInt8(p++);
    result.key = buffer.getInt8(p++);
    result.velocity = buffer.getInt8(p++);
    result.panning = buffer.getUint8(p++);
    result.pitch = buffer.getInt16(p, 1);

    return result
  }

  constructor() {
    this.instrument = 0;
    this.key = 0;
    this.velocity = 0;
    this.panning = 0;
    this.pitch = 0;
    this.layer = 0;
  }

  toString(be) {
    if (be)
      return [
        "note.harp"
      ][this.instrument] || void 0;
    return [
      "block.note_block.harp"
    ][this.instrument] || void 0;
  }
}

class NBSPlayerIterator {
  constructor(nbs) {
    this.nbs = nbs;
    this.tick = -1;
    this.tickIndex = 0;
    this.maxTick = this.nbs.effectiveTicks[this.nbs.effectiveTicks.length - 1].tick;
  }

  next() {
    var result, s = this.nbs.effectiveTicks;
    if (this.tick > this.maxTick || this.tickIndex >= s.length)
      return {
        value: void 0,
        done: true
      };
    this.tick++;
    if (s[this.tickIndex].tick == this.tick)
      return {
        value: s[this.tickIndex++],
        done: false
      };
    result = new NBSEffectiveTick();
    result.tick = this.tick;
    return {
      value: result,
      done: false
    };
  }

  [Symbol.iterator]() {
    return this
  }
}

exports.NBSHeader = NBSHeader;
exports.NBS = NBS;
exports.NBSEffectiveLayer = NBSEffectiveTick;
exports.NBSNote = NBSNote;
exports.NBSCustomInstrument = NBSCustomInstrument;
exports.NBSEffectiveTick = NBSEffectiveTick;
exports.NBSPlayerIterator = NBSPlayerIterator;