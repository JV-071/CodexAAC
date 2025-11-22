package config

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
)

// Stage represents a single rate stage
type Stage struct {
	MinLevel  int  `json:"minLevel"`
	MaxLevel  *int `json:"maxLevel,omitempty"` // nil means infinite
	Multiplier int `json:"multiplier"`
}

// StagesConfig holds all rate stages from stages.lua
type StagesConfig struct {
	ExperienceStages []Stage `json:"experienceStages"`
	SkillsStages    []Stage `json:"skillsStages"`
	MagicLevelStages []Stage `json:"magicLevelStages"`
}

var (
	stagesConfig      *StagesConfig
	stagesConfigMutex sync.RWMutex
	stagesFilePath    string
	// Regex to match stage entries: { minlevel = X, maxlevel = Y, multiplier = Z }
	stageEntryRegex = regexp.MustCompile(`(\w+)\s*=\s*(\d+)`)
)

// InitStagesConfig initializes stages configuration from stages.lua
func InitStagesConfig(stagesPath string) error {
	stagesFilePath = stagesPath
	return ReloadStagesConfig()
}

// ReloadStagesConfig reloads stages configuration from stages.lua
func ReloadStagesConfig() error {
	if stagesFilePath == "" {
		// Try to infer path from config.lua path
		configPath := os.Getenv("SERVER_CONFIG_PATH")
		if configPath != "" {
			// Assume stages.lua is in the same directory as config.lua
			dir := strings.TrimSuffix(configPath, "config.lua")
			stagesFilePath = dir + "stages.lua"
		} else {
			return fmt.Errorf("stages file path not configured")
		}
	}

	file, err := os.Open(stagesFilePath)
	if err != nil {
		return fmt.Errorf("failed to open stages.lua: %w", err)
	}
	defer file.Close()

	config := &StagesConfig{
		ExperienceStages: []Stage{},
		SkillsStages:     []Stage{},
		MagicLevelStages: []Stage{},
	}

	scanner := bufio.NewScanner(file)
	var currentTable string
	var currentStage Stage
	inStage := false

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "--") {
			continue
		}

		// Check if we're starting a new table
		if strings.Contains(line, "experienceStages") {
			currentTable = "experience"
			continue
		} else if strings.Contains(line, "skillsStages") {
			currentTable = "skills"
			continue
		} else if strings.Contains(line, "magicLevelStages") {
			currentTable = "magic"
			continue
		}

		// Check if we're starting a new stage entry
		if strings.HasPrefix(line, "{") {
			inStage = true
			currentStage = Stage{}
			continue
		}

		// Check if we're ending a stage entry
		if strings.HasPrefix(line, "}") {
			if inStage {
				switch currentTable {
				case "experience":
					config.ExperienceStages = append(config.ExperienceStages, currentStage)
				case "skills":
					config.SkillsStages = append(config.SkillsStages, currentStage)
				case "magic":
					config.MagicLevelStages = append(config.MagicLevelStages, currentStage)
				}
				inStage = false
			}
			continue
		}

		// Parse stage properties
		if inStage {
			matches := stageEntryRegex.FindStringSubmatch(line)
			if len(matches) == 3 {
				key := strings.ToLower(matches[1])
				value, err := strconv.Atoi(matches[2])
				if err != nil {
					continue
				}

				switch key {
				case "minlevel":
					currentStage.MinLevel = value
				case "maxlevel":
					currentStage.MaxLevel = &value
				case "multiplier":
					currentStage.Multiplier = value
				}
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading stages.lua: %w", err)
	}

	stagesConfigMutex.Lock()
	stagesConfig = config
	stagesConfigMutex.Unlock()

	return nil
}

// GetStagesConfig returns the current stages configuration
func GetStagesConfig() *StagesConfig {
	stagesConfigMutex.RLock()
	defer stagesConfigMutex.RUnlock()

	if stagesConfig == nil {
		return &StagesConfig{
			ExperienceStages: []Stage{},
			SkillsStages:     []Stage{},
			MagicLevelStages: []Stage{},
		}
	}

	// Return a copy
	return &StagesConfig{
		ExperienceStages: append([]Stage{}, stagesConfig.ExperienceStages...),
		SkillsStages:     append([]Stage{}, stagesConfig.SkillsStages...),
		MagicLevelStages: append([]Stage{}, stagesConfig.MagicLevelStages...),
	}
}

