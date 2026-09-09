const INSTJE = Object.freeze({
  0: "block.note_block.harp",
  1: "block.note_block.bass",
  2: "block.note_block.basedrum",
  3: "block.note_block.snare",
  4: "block.note_block.hat",
  5: "block.note_block.guitar",
  6: "block.note_block.flute",
  7: "block.note_block.bell",
  8: "block.note_block.chime",
  9: "block.note_block.xylophone",
  10: "block.note_block.iron_xylophone",
  11: "block.note_block.cow_bell",
  12: "block.note_block.didgeridoo",
  13: "block.note_block.bit",
  14: "block.note_block.banjo",
  15: "block.note_block.pling"
}), INSTBE = Object.freeze({
  0: "note.harp",
  1: "note.bass",
  2: "note.bd",
  3: "note.snare",
  4: "note.hat",
  5: "note.guitar",
  6: "note.flute",
  7: "note.bell",
  8: "note.chime",
  9: "note.xylophone",
  10: "note.iron_xylophone",
  11: "note.cow_bell",
  12: "note.didgeridoo",
  13: "note.bit",
  14: "note.banjo",
  15: "note.pling"
});

function readLengthedStringUtf8(buffer, cursor) {
  var l = buffer.getInt32(cursor, 1);
  return {
    value: new TextDecoder().decode((new Uint8Array(buffer.buffer)).slice(cursor + 4, cursor + 4 + l)),
    length: l + 4
  }
}

function writeLengthedStringUtf8(buffer, cursor, value) {
  var bytes = new TextEncoder().encode(value);
  buffer.setInt32(cursor, bytes.length, 1);
  (new Uint8Array(buffer.buffer)).set(bytes, cursor + 4);
  return cursor + 4 + bytes.length
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

  serialize(buffer, cursor) {
    var p = cursor;

    buffer.setInt16(p, this.songLengthOld, 1), p += 2;
    buffer.setInt8(p, this.version), p++;
    buffer.setInt8(p, this.instumentCtr), p++;
    buffer.setInt16(p, this.songLength, 1), p += 2;
    buffer.setInt16(p, this.layerCtr, 1), p += 2;
    p = writeLengthedStringUtf8(buffer, p, this.songName);
    p = writeLengthedStringUtf8(buffer, p, this.author);
    p = writeLengthedStringUtf8(buffer, p, this.orignalAuthor);
    p = writeLengthedStringUtf8(buffer, p, this.description);
    buffer.setInt16(p, this.tempo, 1), p += 2;
    buffer.setInt8(p, this.autoSave), p++;
    buffer.setInt8(p, this.autoSaveDuration), p++;
    buffer.setInt8(p, this.timeSign), p++;
    buffer.setInt32(p, this.minutes, 1), p += 4;
    buffer.setInt32(p, this.leftClick, 1), p += 4;
    buffer.setInt32(p, this.rightClick, 1), p += 4;
    buffer.setInt32(p, this.noteAdded, 1), p += 4;
    buffer.setInt32(p, this.noteRemoved, 1), p += 4;
    p = writeLengthedStringUtf8(buffer, p, this.midiFile);
    buffer.setInt8(p, this.loop), p++;
    buffer.setInt8(p, this.maxLoop), p++;
    buffer.setInt16(p, this.loopStartTick, 1), p += 2;

    return p
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

  getTimeSecFor(tick) {
    return tick / this.header.tempo * 100
  }

  /**
   * Calculate the time to the beginning of the song in gameticks.
   * @param {Number} tick 
   * @returns {Number}
   */
  getTimeGtFor(tick) {
    return 20 / this.header.tempo * 100 * tick
  }

  serialize() {
    var i
      , size = 0
      , prevTick = -1
      , buffer
      , dtv
      , p;

    // Keep the layer count in sync so the file always stays readable.
    this.header.layerCtr = this.layers.length;

    // Header.
    size += 2 + 1 + 1 + 2 + 2; // songLengthOld, version, instumentCtr, songLength, layerCtr
    size += 4 + new TextEncoder().encode(this.header.songName).length;
    size += 4 + new TextEncoder().encode(this.header.author).length;
    size += 4 + new TextEncoder().encode(this.header.orignalAuthor).length;
    size += 4 + new TextEncoder().encode(this.header.description).length;
    size += 2 + 1 + 1 + 1; // tempo, autoSave, autoSaveDuration, timeSign
    size += 4 * 5; // minutes, leftClick, rightClick, noteAdded, noteRemoved
    size += 4 + new TextEncoder().encode(this.header.midiFile).length;
    size += 1 + 1 + 2; // loop, maxLoop, loopStartTick

    // Notes: tick jump + (layer jump + note) per note + layer terminator.
    size += 2; // end-of-notes terminator
    for (i = 0; i < this.effectiveTicks.length; i++)
      size += 2 + 2 + this.effectiveTicks[i].notes.length * (2 + 6);

    // Layers.
    for (i = 0; i < this.layers.length; i++)
      size += 4 + new TextEncoder().encode(this.layers[i].name).length + 1 + 1 + 1;

    // Custom instruments.
    size += 1; // instrument count
    for (i = 0; i < this.customInstuments.length; i++)
      size += 4 + new TextEncoder().encode(this.customInstuments[i].name).length
        + 4 + new TextEncoder().encode(this.customInstuments[i].path).length
        + 1 + 1;

    buffer = new ArrayBuffer(size);
    dtv = new DataView(buffer);
    p = 0;

    p = this.header.serialize(dtv, p);

    // Notes.
    for (i = 0; i < this.effectiveTicks.length; i++) {
      dtv.setInt16(p, this.effectiveTicks[i].tick - prevTick, 1), p += 2;
      prevTick = this.effectiveTicks[i].tick;
      p = this.effectiveTicks[i].serialize(dtv, p);
    }
    dtv.setInt16(p, 0, 1), p += 2;

    // Layers.
    for (i = 0; i < this.layers.length; i++)
      p = this.layers[i].serialize(dtv, p);

    // Custom instruments.
    dtv.setUint8(p, this.customInstuments.length), p++;
    for (i = 0; i < this.customInstuments.length; i++)
      p = this.customInstuments[i].serialize(dtv, p);

    return buffer
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

  serialize(buffer, cursor) {
    var p = cursor;

    p = writeLengthedStringUtf8(buffer, p, this.name);
    buffer.setInt8(p, this.lock), p++;
    buffer.setInt8(p, this.volume), p++;
    buffer.setUint8(p, this.stereo), p++;

    return p
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
      length: p - cursor
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

  serialize(buffer, cursor) {
    var p = cursor;

    p = writeLengthedStringUtf8(buffer, p, this.name);
    p = writeLengthedStringUtf8(buffer, p, this.path);
    buffer.setInt8(p, this.key), p++;
    buffer.setUint8(p, this.pressPianoKey), p++;

    return p
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

  serialize(buffer, cursor) {
    var p = cursor
      , layer = -1
      , i;

    for (i = 0; i < this.notes.length; i++) {
      buffer.setInt16(p, this.notes[i].layer - layer, 1), p += 2;
      layer = this.notes[i].layer;
      p = this.notes[i].serialize(buffer, p);
    }
    buffer.setInt16(p, 0, 1), p += 2;

    return p
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

  serialize(buffer, cursor) {
    buffer.setInt8(cursor, this.instrument);
    buffer.setInt8(cursor + 1, this.key);
    buffer.setInt8(cursor + 2, this.velocity);
    buffer.setUint8(cursor + 3, this.panning);
    buffer.setInt16(cursor + 4, this.pitch, 1);
    return cursor + 6
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
exports.NBSLayer = NBSLayer;
exports.NBSEffectiveLayer = NBSEffectiveTick;
exports.NBSNote = NBSNote;
exports.NBSCustomInstrument = NBSCustomInstrument;
exports.NBSEffectiveTick = NBSEffectiveTick;
exports.NBSPlayerIterator = NBSPlayerIterator;
exports.INSTBE = INSTBE;
exports.INSTJE = INSTJE;