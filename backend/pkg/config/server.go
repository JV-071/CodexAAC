package config

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ServerConfig holds server configuration from config.lua
type ServerConfig struct {
	ServerName      string
	WorldType       string
	IP              string
	LoginPort       int
	GamePort        int
	RateExp         int
	RateSkill       int
	RateMagic       int
	RateLoot        int
	RateSpawn       int
	MapName         string
	MapAuthor       string
	HouseRentPeriod string
	MaxPlayers      int
	OwnerName       string
	OwnerEmail      string
	URL             string
	Location        string
	LastLoaded      time.Time
}

var (
	serverConfig      *ServerConfig
	serverConfigOnce  sync.Once
	serverConfigMutex sync.RWMutex
	configFilePath    string
	// Compile regex once for better performance
	configLineRegex = regexp.MustCompile(`^(\w+)\s*=\s*(.+)$`)
)

// configSetter is a function that sets a value in ServerConfig
type configSetter func(*ServerConfig, string)

// Helper function to parse and set integer values
func parseIntValue(value string) (int, bool) {
	intVal, err := strconv.Atoi(value)
	return intVal, err == nil
}

// configSetters maps config keys (lowercase) to their setter functions
// This map-based approach makes it easy to add new fields without modifying parsing logic
var configSetters = map[string]configSetter{
	"servername": func(c *ServerConfig, v string) {
		c.ServerName = v
	},
	"worldtype": func(c *ServerConfig, v string) {
		c.WorldType = v
	},
	"ip": func(c *ServerConfig, v string) {
		c.IP = v
	},
	"loginprotocolport": func(c *ServerConfig, v string) {
		if port, ok := parseIntValue(v); ok {
			c.LoginPort = port
		}
	},
	"gameprotocolport": func(c *ServerConfig, v string) {
		if port, ok := parseIntValue(v); ok {
			c.GamePort = port
		}
	},
	"rateexp": func(c *ServerConfig, v string) {
		if rate, ok := parseIntValue(v); ok {
			c.RateExp = rate
		}
	},
	"rateskill": func(c *ServerConfig, v string) {
		if rate, ok := parseIntValue(v); ok {
			c.RateSkill = rate
		}
	},
	"ratemagic": func(c *ServerConfig, v string) {
		if rate, ok := parseIntValue(v); ok {
			c.RateMagic = rate
		}
	},
	"rateloot": func(c *ServerConfig, v string) {
		if rate, ok := parseIntValue(v); ok {
			c.RateLoot = rate
		}
	},
	"ratespawn": func(c *ServerConfig, v string) {
		if rate, ok := parseIntValue(v); ok {
			c.RateSpawn = rate
		}
	},
	"mapname": func(c *ServerConfig, v string) {
		c.MapName = v
	},
	"mapauthor": func(c *ServerConfig, v string) {
		c.MapAuthor = v
	},
	"houserentperiod": func(c *ServerConfig, v string) {
		c.HouseRentPeriod = v
	},
	"maxplayers": func(c *ServerConfig, v string) {
		if max, ok := parseIntValue(v); ok {
			c.MaxPlayers = max
		}
	},
	"ownername": func(c *ServerConfig, v string) {
		c.OwnerName = v
	},
	"owneremail": func(c *ServerConfig, v string) {
		c.OwnerEmail = v
	},
	"url": func(c *ServerConfig, v string) {
		c.URL = v
	},
	"location": func(c *ServerConfig, v string) {
		c.Location = v
	},
}

// InitServerConfig initializes server configuration from config.lua
// Should be called once at application startup
func InitServerConfig(configPath string) error {
	configFilePath = configPath
	return ReloadServerConfig()
}

// ReloadServerConfig reloads server configuration from config.lua
func ReloadServerConfig() error {
	if configFilePath == "" {
		// Try default path
		configFilePath = os.Getenv("SERVER_CONFIG_PATH")
		if configFilePath == "" {
			return fmt.Errorf("server config path not configured")
		}
	}

	file, err := os.Open(configFilePath)
	if err != nil {
		return fmt.Errorf("failed to open config.lua: %w", err)
	}
	defer file.Close()

	config := &ServerConfig{
		LastLoaded: time.Now(),
	}

	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		
		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "--") {
			continue
		}

		// Parse key-value pairs
		// Format: key = value or key = "value"
		parseConfigLine(line, config)
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading config.lua: %w", err)
	}

	serverConfigMutex.Lock()
	serverConfig = config
	serverConfigMutex.Unlock()

	return nil
}

// parseConfigLine parses a single line from config.lua
func parseConfigLine(line string, config *ServerConfig) {
	// Remove comments from line
	if idx := strings.Index(line, "--"); idx != -1 {
		line = line[:idx]
		line = strings.TrimSpace(line)
	}

	// Skip if line doesn't contain '='
	if !strings.Contains(line, "=") {
		return
	}

	// Match: key = value or key = "value" or key = { ... }
	// Support both quoted and unquoted values
	matches := configLineRegex.FindStringSubmatch(line)
	if len(matches) != 3 {
		return
	}

	key := strings.TrimSpace(matches[1])
	value := strings.TrimSpace(matches[2])

	// Skip if value is a table (starts with {)
	if strings.HasPrefix(value, "{") {
		return
	}

	// Skip if value contains expressions (like "60 * 1000") - we only want simple values
	// This is a simple heuristic: if it contains operators, skip it
	if strings.ContainsAny(value, "+-*/%") && !strings.HasPrefix(value, `"`) && !strings.HasPrefix(value, `'`) {
		return
	}

	// Remove quotes if present (both single and double)
	value = strings.Trim(value, `"'`)

	// Normalize key to lowercase for case-insensitive matching
	keyLower := strings.ToLower(key)

	// Look up setter in map and apply if found
	if setter, exists := configSetters[keyLower]; exists {
		setter(config, value)
	}
}

// GetServerConfig returns the current server configuration
// Returns a copy to prevent external modifications
func GetServerConfig() *ServerConfig {
	serverConfigMutex.RLock()
	defer serverConfigMutex.RUnlock()

	if serverConfig == nil {
		return &ServerConfig{} // Return empty config if not loaded
	}

	// Return a copy to prevent external modifications
	return &ServerConfig{
		ServerName:      serverConfig.ServerName,
		WorldType:       serverConfig.WorldType,
		IP:              serverConfig.IP,
		LoginPort:       serverConfig.LoginPort,
		GamePort:        serverConfig.GamePort,
		RateExp:         serverConfig.RateExp,
		RateSkill:       serverConfig.RateSkill,
		RateMagic:       serverConfig.RateMagic,
		RateLoot:        serverConfig.RateLoot,
		RateSpawn:       serverConfig.RateSpawn,
		MapName:         serverConfig.MapName,
		MapAuthor:       serverConfig.MapAuthor,
		HouseRentPeriod: serverConfig.HouseRentPeriod,
		MaxPlayers:      serverConfig.MaxPlayers,
		OwnerName:       serverConfig.OwnerName,
		OwnerEmail:      serverConfig.OwnerEmail,
		URL:             serverConfig.URL,
		Location:        serverConfig.Location,
		LastLoaded:      serverConfig.LastLoaded,
	}
}

// GetServerName returns the server name from config
// Optimized to avoid full struct copy
func GetServerName() string {
	serverConfigMutex.RLock()
	defer serverConfigMutex.RUnlock()

	if serverConfig != nil && serverConfig.ServerName != "" {
		return serverConfig.ServerName
	}
	return "CodexAAC" // Default fallback
}

// PublicServerConfig represents the public server configuration (for API responses)
type PublicServerConfig struct {
	ServerName      string `json:"serverName"`
	WorldType       string `json:"worldType"`
	IP              string `json:"ip"`
	LoginPort       int    `json:"loginPort"`
	GamePort        int    `json:"gamePort"`
	RateExp         int    `json:"rateExp"`
	RateSkill       int    `json:"rateSkill"`
	RateMagic       int    `json:"rateMagic"`
	RateLoot        int    `json:"rateLoot"`
	RateSpawn       int    `json:"rateSpawn"`
	MapName         string `json:"mapName"`
	MapAuthor       string `json:"mapAuthor"`
	HouseRentPeriod string `json:"houseRentPeriod"`
	MaxPlayers      int    `json:"maxPlayers"`
	OwnerName       string `json:"ownerName"`
	OwnerEmail      string `json:"ownerEmail"`
	URL             string `json:"url"`
	Location        string `json:"location"`
}

// GetPublicServerConfig returns the public server configuration (excludes sensitive data)
func GetPublicServerConfig() PublicServerConfig {
	config := GetServerConfig()
	return PublicServerConfig{
		ServerName:      config.ServerName,
		WorldType:       config.WorldType,
		IP:              config.IP,
		LoginPort:       config.LoginPort,
		GamePort:        config.GamePort,
		RateExp:         config.RateExp,
		RateSkill:       config.RateSkill,
		RateMagic:       config.RateMagic,
		RateLoot:        config.RateLoot,
		RateSpawn:       config.RateSpawn,
		MapName:         config.MapName,
		MapAuthor:       config.MapAuthor,
		HouseRentPeriod: config.HouseRentPeriod,
		MaxPlayers:      config.MaxPlayers,
		OwnerName:       config.OwnerName,
		OwnerEmail:      config.OwnerEmail,
		URL:             config.URL,
		Location:        config.Location,
	}
}

