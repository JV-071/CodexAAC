package config

import "unicode"

const (
	UnknownVocation = "Unknown"
)

// CharacterCreationConfig holds default values for character creation
type CharacterCreationConfig struct {
	// Health and Mana
	Health    int
	MaxHealth int
	Mana      int
	MaxMana   int

	Experience int64

	TownID int

	SkillFist      int
	SkillClub      int
	SkillSword     int
	SkillAxe       int
	SkillDist      int
	SkillShielding int
	SkillFishing   int

	MagLevel int

	Level int

	LookBody  int
	LookFeet  int
	LookHead  int
	LookLegs  int
}

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

var VocationMapping = map[string]int{
	"sorcerer": 1,
	"druid":    2,
	"paladin":  3,
	"knight":   4,
}

var SexMapping = map[string]int{
	"male":   1,
	"female": 0,
}

var VocationReverseMapping map[int]string
var SexReverseMapping map[int]string

var LookTypeMapping = map[int]int{
	1: 128, // male
	0: 136, // female
}

func init() {
	VocationReverseMapping = make(map[int]string, len(VocationMapping))
	for name, id := range VocationMapping {
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

	SexReverseMapping = make(map[int]string, len(SexMapping))
	for name, id := range SexMapping {
		SexReverseMapping[id] = name
	}
}

func GetVocationName(vocationID int) string {
	if name, ok := VocationReverseMapping[vocationID]; ok {
		return name
	}
	return UnknownVocation
}

func GetSexName(sexID int) string {
	if name, ok := SexReverseMapping[sexID]; ok {
		return name
	}
	return "unknown"
}

