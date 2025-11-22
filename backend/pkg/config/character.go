package config

import "unicode"

const (
	// UnknownVocation is returned when a vocation ID is not found
	UnknownVocation = "Unknown"
)

// CharacterCreationConfig holds default values for character creation
type CharacterCreationConfig struct {
	// Health and Mana
	Health    int
	MaxHealth int
	Mana      int
	MaxMana   int

	// Experience
	Experience int64

	// Location
	TownID int

	// Skills (all default to 10)
	SkillFist      int
	SkillClub      int
	SkillSword     int
	SkillAxe       int
	SkillDist      int
	SkillShielding int
	SkillFishing   int

	// Magic
	MagLevel int

	// Level
	Level int

	// Outfit (lookbody, lookfeet, lookhead, looklegs)
	// Note: looktype is determined by sex (see LookTypeMapping)
	LookBody  int
	LookFeet  int
	LookHead  int
	LookLegs  int
}

// GetCharacterCreationConfig returns the default configuration for character creation
func GetCharacterCreationConfig() *CharacterCreationConfig {
	return &CharacterCreationConfig{
		Health:         185,
		MaxHealth:      185,
		Mana:           185,
		MaxMana:        185,
		Experience:     4200,
		TownID:         1,
		SkillFist:      10,
		SkillClub:      10,
		SkillSword:     10,
		SkillAxe:       10,
		SkillDist:      10,
		SkillShielding: 10,
		SkillFishing:   10,
		MagLevel:       0,
		Level:          1,
		LookBody:       85,
		LookFeet:       114,
		LookHead:       19,
		LookLegs:       86,
	}
}

// VocationMapping maps vocation names to IDs
var VocationMapping = map[string]int{
	"sorcerer": 1,
	"druid":    2,
	"paladin":  3,
	"knight":   4,
}

// SexMapping maps sex strings to IDs
var SexMapping = map[string]int{
	"male":   1,
	"female": 0,
}

// VocationReverseMapping maps vocation IDs to names
// Automatically generated from VocationMapping in init()
var VocationReverseMapping map[int]string
// SexReverseMapping maps sex IDs to names
// Automatically generated from SexMapping in init()
var SexReverseMapping map[int]string

// LookTypeMapping maps sex IDs to looktype values
// Male: 128, Female: 136
var LookTypeMapping = map[int]int{
	1: 128, // male
	0: 136, // female
}

// init generates reverse mappings from forward mappings
// This ensures we only maintain one source of truth
func init() {
	// Generate VocationReverseMapping
	VocationReverseMapping = make(map[int]string, len(VocationMapping))
	for name, id := range VocationMapping {
		// Capitalize first letter safely
		if len(name) == 0 {
			continue
		}
		runes := []rune(name)
		runes[0] = unicode.ToUpper(runes[0])
		for i := 1; i < len(runes); i++ {
			runes[i] = unicode.ToLower(runes[i])
		}
		VocationReverseMapping[id] = string(runes)
	}

	// Generate SexReverseMapping
	SexReverseMapping = make(map[int]string, len(SexMapping))
	for name, id := range SexMapping {
		SexReverseMapping[id] = name
	}
}

// GetVocationName returns the vocation name for a given vocation ID
// Returns UnknownVocation constant if the ID is not found
func GetVocationName(vocationID int) string {
	if name, ok := VocationReverseMapping[vocationID]; ok {
		return name
	}
	return UnknownVocation
}

// GetSexName returns the sex name for a given sex ID
// Returns the name from SexReverseMapping, or "unknown" if not found
func GetSexName(sexID int) string {
	if name, ok := SexReverseMapping[sexID]; ok {
		return name
	}
	return "unknown"
}

