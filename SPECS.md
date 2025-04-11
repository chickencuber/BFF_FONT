# BFF Font specs
## Versioning
the versioning for BFF font uses opaque versioning, and the first 3 bytes are always for the version
## Version specs
right now there is only one version, version 0.0.1
__
### 0.0.1 specs
#### header
1. first 3 bytes make up the version(0.0.1)
2. width: u8
3. height: u8
4. char_amount: u8
#### glyph
1. char: u8 
2. line: u8[]  # the length is the number of bytes that has at least the number of bits in the width, line repeats for every length
#### example
```
#version
0x00
0x00
0x01
#header
0x05 #width
0x07 #height
0x02 #char_amount
#glyphs
'\0' #char (.notdef)
0b00000000
0b00000000
0b00000000
0b00000000
0b00000000
0b00000000
0b00000000
#next glyph
'1' #char
0b00000100
0b00001100
0b00000100
0b00000100
0b00000100
0b00000100
0b00001110

```


